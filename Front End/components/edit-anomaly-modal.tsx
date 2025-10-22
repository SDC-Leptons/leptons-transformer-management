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

interface EditAnomalyModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (anomaly: { box: [number, number, number, number]; class: string }) => void;
  imageUrl: string;
  anomaly: {
    id: string;
    box: [number, number, number, number]; // [x, y, width, height]
    class: string;
    confidence: number;
  } | null;
}

export const EditAnomalyModal: React.FC<EditAnomalyModalProps> = ({ open, onClose, onUpdate, imageUrl, anomaly }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [box, setBox] = useState<[number, number, number, number] | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedType, setSelectedType] = useState(anomaly?.class || ANOMALY_TYPES[0]);
  const [dragAnchor, setDragAnchor] = useState<number | null>(null); // 0-3 for corners, 4 for center

  const STAGE_WIDTH = 400;
  const STAGE_HEIGHT = 340;

  // Track the uniform scale used for rendering
  const [uniformScale, setUniformScale] = useState(1);
  const [imageDisplaySize, setImageDisplaySize] = useState({ width: 0, height: 0 });
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!open || !anomaly) return;
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
      const offsetX = (STAGE_WIDTH - displayWidth) / 2;
      const offsetY = (STAGE_HEIGHT - displayHeight) / 2;
      setImageOffset({ x: offsetX, y: offsetY });
      
  // Backend returns [x_center, y_center, width, height]
  // Convert to [x1, y1, x2, y2] (two corner points), then scale to canvas coordinates
  const [x_center, y_center, width, height] = anomaly.box;
  const x1 = x_center - width / 2;
  const y1 = y_center - height / 2;
  const x2 = x_center + width / 2;
  const y2 = y_center + height / 2;

  const canvasX1 = x1 * scale + offsetX;
  const canvasY1 = y1 * scale + offsetY;
  const canvasX2 = x2 * scale + offsetX;
  const canvasY2 = y2 * scale + offsetY;
  setBox([canvasX1, canvasY1, canvasX2, canvasY2]);
  setSelectedType(anomaly.class);
    };
  }, [imageUrl, open, anomaly]);

  // Mouse events for editing
  const handleStageMouseDown = (e: any) => {
    if (!box) return;
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
  };

  const handleStageMouseMove = (e: any) => {
    if (dragAnchor !== null && box) {
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
    if (dragAnchor !== null) {
      setDragAnchor(null);
    }
  };

  const handleUpdate = () => {
    if (!box || !image) return;
    // Convert canvas box [x1, y1, x2, y2] back to original image coordinates
    // Backend expects [x1, y1, x2, y2] format
    const scale = Math.min(imageDisplaySize.width / image.width, imageDisplaySize.height / image.height);
    
    const x1 = (Math.min(box[0], box[2]) - imageOffset.x) / scale;
    const y1 = (Math.min(box[1], box[3]) - imageOffset.y) / scale;
    const x2 = (Math.max(box[0], box[2]) - imageOffset.x) / scale;
    const y2 = (Math.max(box[1], box[3]) - imageOffset.y) / scale;
    
    const normBox: [number, number, number, number] = [x1, y1, x2, y2];
    onUpdate({ box: normBox, class: selectedType });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl min-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit Anomaly</DialogTitle>
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
              {/* Draw current box (yellow) */}
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
              {box && [0, 1, 2, 3].map(i => {
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={!box} className="bg-indigo-600 hover:bg-indigo-700 text-white">Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
