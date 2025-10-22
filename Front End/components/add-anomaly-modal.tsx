import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";

const ANOMALY_TYPES = [
  "Full wire overload",
  "Loose Joint -Faulty",
  "Loose Joint -Potential",
  "Point Overload - Faulty",
  "normal",
];

interface Anomaly {
  id?: string;
  box: [number, number, number, number]; // [x, y, width, height]
  class: string;
  confidence: number;
  madeBy?: "AI" | "User";
}

interface AddAnomalyModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (anomaly: { box: [number, number, number, number]; class: string }) => void;
  imageUrl: string;
  existingAnomalies?: Anomaly[];
  onDeleteAnomaly?: (anomalyId: string) => void;
  onEditAnomaly?: (anomaly: Anomaly) => void;
}

export const AddAnomalyModal: React.FC<AddAnomalyModalProps> = ({ open, onClose, onAdd, imageUrl, existingAnomalies = [], onDeleteAnomaly, onEditAnomaly }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [box, setBox] = useState<[number, number, number, number] | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedType, setSelectedType] = useState(ANOMALY_TYPES[0]);
  const [mode, setMode] = useState<'draw' | 'edit'>('draw');
  const [dragAnchor, setDragAnchor] = useState<number | null>(null); // 0-3 for corners, 4 for center
  const [highlightedAnomalyId, setHighlightedAnomalyId] = useState<string | null>(null);

  const STAGE_WIDTH = 400;
  const STAGE_HEIGHT = 340;

  // Track the uniform scale used for rendering
  const [uniformScale, setUniformScale] = useState(1);
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  // Color palette for anomaly boxes
  const COLORS = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#fb7185", "#38bdf8", "#f59e42", "#10b981", "#eab308"];

  React.useEffect(() => {
    if (!open) return;
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      // Calculate uniform scale to fit image in canvas while preserving aspect ratio
      const scaleX = STAGE_WIDTH / img.width;
      const scaleY = STAGE_HEIGHT / img.height;
      const scale = Math.min(scaleX, scaleY);
      setUniformScale(scale);
      const displayWidth = img.width * scale;
      const displayHeight = img.height * scale;
      setImageDisplaySize({ width: displayWidth, height: displayHeight });
      // Center the image in the canvas
      setImageOffset({
        x: (STAGE_WIDTH - displayWidth) / 2,
        y: (STAGE_HEIGHT - displayHeight) / 2,
      });
    };
  }, [imageUrl, open]);

  // Mouse events for drawing and editing
  const handleStageMouseDown = (e: any) => {
    if (mode === 'draw') {
      const { x, y } = e.target.getStage().getPointerPosition();
      // Clamp to image bounds
      const clampedX = Math.max(imageOffset.x, Math.min(x, imageOffset.x + imageDisplaySize.width));
      const clampedY = Math.max(imageOffset.y, Math.min(y, imageOffset.y + imageDisplaySize.height));
      setStartPos({ x: clampedX, y: clampedY });
      setBox([clampedX, clampedY, clampedX, clampedY]);
      setDrawing(true);
    } else if (mode === 'edit' && box) {
      const { x, y } = e.target.getStage().getPointerPosition();
      // Check if near a corner (resize)
      const corners = [
        { x: box[0], y: box[1] },
        { x: box[2], y: box[1] },
        { x: box[2], y: box[3] },
        { x: box[0], y: box[3] },
      ];
      for (let i = 0; i < 4; i++) {
        if (Math.abs(x - corners[i].x) < 10 && Math.abs(y - corners[i].y) < 10) {
          setDragAnchor(i);
          return;
        }
      }
      // Check if inside box (move)
      if (
        x > Math.min(box[0], box[2]) &&
        x < Math.max(box[0], box[2]) &&
        y > Math.min(box[1], box[3]) &&
        y < Math.max(box[1], box[3])
      ) {
        setDragAnchor(4);
        setStartPos({ x, y });
      }
    }
  };

  const handleStageMouseMove = (e: any) => {
    if (mode === 'draw' && drawing && startPos) {
      const { x, y } = e.target.getStage().getPointerPosition();
      // Clamp to image bounds
      const clampedX = Math.max(imageOffset.x, Math.min(x, imageOffset.x + imageDisplaySize.width));
      const clampedY = Math.max(imageOffset.y, Math.min(y, imageOffset.y + imageDisplaySize.height));
      setBox([startPos.x, startPos.y, clampedX, clampedY]);
    } else if (mode === 'edit' && dragAnchor !== null && box) {
      const { x, y } = e.target.getStage().getPointerPosition();
      // Clamp to image bounds
      const clampedX = Math.max(imageOffset.x, Math.min(x, imageOffset.x + imageDisplaySize.width));
      const clampedY = Math.max(imageOffset.y, Math.min(y, imageOffset.y + imageDisplaySize.height));
      let newBox = [...box] as [number, number, number, number];
      if (dragAnchor === 0) {
        newBox[0] = clampedX;
        newBox[1] = clampedY;
      } else if (dragAnchor === 1) {
        newBox[2] = clampedX;
        newBox[1] = clampedY;
      } else if (dragAnchor === 2) {
        newBox[2] = clampedX;
        newBox[3] = clampedY;
      } else if (dragAnchor === 3) {
        newBox[0] = clampedX;
        newBox[3] = clampedY;
      } else if (dragAnchor === 4 && startPos) {
        // Move whole box
        const dx = clampedX - startPos.x;
        const dy = clampedY - startPos.y;
        newBox = [box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy];
        // Clamp box to stay within image bounds
        const boxWidth = Math.abs(newBox[2] - newBox[0]);
        const boxHeight = Math.abs(newBox[3] - newBox[1]);
        const minX = Math.min(newBox[0], newBox[2]);
        const minY = Math.min(newBox[1], newBox[3]);
        if (minX < imageOffset.x) {
          const shift = imageOffset.x - minX;
          newBox[0] += shift;
          newBox[2] += shift;
        }
        if (minY < imageOffset.y) {
          const shift = imageOffset.y - minY;
          newBox[1] += shift;
          newBox[3] += shift;
        }
        const maxX = Math.max(newBox[0], newBox[2]);
        const maxY = Math.max(newBox[1], newBox[3]);
        if (maxX > imageOffset.x + imageDisplaySize.width) {
          const shift = maxX - (imageOffset.x + imageDisplaySize.width);
          newBox[0] -= shift;
          newBox[2] -= shift;
        }
        if (maxY > imageOffset.y + imageDisplaySize.height) {
          const shift = maxY - (imageOffset.y + imageDisplaySize.height);
          newBox[1] -= shift;
          newBox[3] -= shift;
        }
        setStartPos({ x: clampedX, y: clampedY });
      }
      setBox(newBox);
    }
  };

  const handleStageMouseUp = () => {
    if (mode === 'draw' && drawing) {
      setDrawing(false);
      setMode('edit');
    } else if (mode === 'edit' && dragAnchor !== null) {
      setDragAnchor(null);
    }
  };

  const handleClear = () => {
    setBox(null);
    setMode('draw');
    setStartPos(null);
    setDrawing(false);
    setDragAnchor(null);
  };

  const handleAdd = () => {
    if (!box || !image) return;
    // Convert canvas box [x1, y1, x2, y2] back to original image coordinates
    // Backend expects [x1, y1, x2, y2] format
    const scale = Math.min(imageDisplaySize.width / image.width, imageDisplaySize.height / image.height);
    
    const x1 = (Math.min(box[0], box[2]) - imageOffset.x) / scale;
    const y1 = (Math.min(box[1], box[3]) - imageOffset.y) / scale;
    const x2 = (Math.max(box[0], box[2]) - imageOffset.x) / scale;
    const y2 = (Math.max(box[1], box[3]) - imageOffset.y) / scale;
    
    // Return in [x1, y1, x2, y2] format to match backend
    const normBox: [number, number, number, number] = [x1, y1, x2, y2];
    onAdd({ box: normBox, class: selectedType });
    handleClear();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="max-w-2xl min-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Anomaly</DialogTitle>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline">Save</Button>
            <Button size="sm" variant="outline">Save and Retrain</Button>
            <Button size="sm" variant="destructive" onClick={onClose}>Cancel</Button>
          </div>
        </DialogHeader>
  <div className="flex flex-col items-center">
          <Stage
            width={STAGE_WIDTH}
            height={STAGE_HEIGHT}
            style={{ border: '1px solid #ccc', background: '#222', marginBottom: 16 }}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
          >
            <Layer>
              {image && (
                <KonvaImage 
                  image={image} 
                  x={imageOffset.x}
                  y={imageOffset.y}
                  width={imageDisplaySize.width} 
                  height={imageDisplaySize.height} 
                />
              )}
              {/* Draw existing anomaly boxes, scaled to canvas */}
              {image && existingAnomalies.map((anomaly, idx) => {
                // Backend returns [x_center, y_center, width, height]
                // Convert to [x1, y1, x2, y2] (two corner points)
                const [x_center, y_center, width, height] = anomaly.box;
                const x1 = x_center - width / 2;
                const y1 = y_center - height / 2;
                const boxWidth = width;
                const boxHeight = height;

                // Calculate scale: how much the image is scaled to fit in the display area
                const scale = Math.min(imageDisplaySize.width / image.width, imageDisplaySize.height / image.height);

                const x = x1 * scale + imageOffset.x;
                const y = y1 * scale + imageOffset.y;
                const isHighlighted = anomaly.id === highlightedAnomalyId;
                return (
                  <Rect
                    x={x}
                    y={y}
                    width={boxWidth * scale}
                    height={boxHeight * scale}
                    key={anomaly.id || idx}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={isHighlighted ? 5 : 3}
                    dash={isHighlighted ? [] : [8, 4]}
                    opacity={isHighlighted ? 1 : 0.8}
                    draggable={false}
                  />
                );
              })}
              {/* Draw current box (yellow), already in canvas coordinates */}
              {box && (
                <Rect
                  x={Math.min(box[0], box[2])}
                  y={Math.min(box[1], box[3])}
                  width={Math.abs(box[2] - box[0])}
                  height={Math.abs(box[3] - box[1])}
                  stroke="#fde047"
                  strokeWidth={3}
                  draggable={false}
                />
              )}
              {/* Draw resize anchors */}
              {mode === 'edit' && box && [0, 1, 2, 3].map(i => {
                const corners = [
                  { x: box[0], y: box[1] },
                  { x: box[2], y: box[1] },
                  { x: box[2], y: box[3] },
                  { x: box[0], y: box[3] },
                ];
                return (
                  <Rect
                    key={i}
                    x={corners[i].x - 5}
                    y={corners[i].y - 5}
                    width={10}
                    height={10}
                    fill="#fff"
                    stroke="#fde047"
                    strokeWidth={2}
                  />
                );
              })}
            </Layer>
          </Stage>
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={handleClear} disabled={!box}>Clear</Button>
          </div>
          <div className="w-full flex flex-col gap-2">
            <label className="font-medium">Anomaly Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ANOMALY_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Existing Anomalies List */}
          {existingAnomalies.length > 0 && (
            <div className="w-full mt-4">
              <div className="font-semibold mb-2">Available Anomalies</div>
              <div className="space-y-2">
                {existingAnomalies.map((anomaly, idx) => (
                  <div 
                    key={anomaly.id || idx} 
                    className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                      anomaly.id === highlightedAnomalyId ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => setHighlightedAnomalyId(anomaly.id || null)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: COLORS[idx % COLORS.length] }}></span>
                      <span className="font-medium">{anomaly.class}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                        {anomaly.madeBy || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 mr-2">Box: [{anomaly.box.map((v: number) => v.toFixed(1)).join(', ')}]</span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditAnomaly) onEditAnomaly(anomaly);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Edit"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M12 20h9"/>
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (anomaly.id && onDeleteAnomaly) onDeleteAnomaly(anomaly.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        title="Delete"
                        disabled={!anomaly.id}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={!box} className="bg-indigo-600 hover:bg-indigo-700 text-white">Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
