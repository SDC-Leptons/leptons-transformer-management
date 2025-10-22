import React from "react";
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage } from "react-konva";
import { AddAnomalyModal } from "@/components/add-anomaly-modal";
import { Plus, Maximize2 } from "lucide-react";

interface Anomaly {
  box: [number, number, number, number];
  confidence: number;
  class: string;
  id?: string;
  madeBy?: "AI" | "User";
}

interface ImageWithAnomaliesProps {
  imageUrl: string;
  anomalies: Anomaly[];
  onAnomalyAdded?: (anomaly: Anomaly) => void;
  onEditAnomaly?: (anomaly: Anomaly) => void;
  onDeleteAnomaly?: (anomalyId: string) => void;
  highlightedAnomalyId?: string | null;
}

export const ImageWithAnomalies: React.FC<ImageWithAnomaliesProps> = ({ imageUrl, anomalies, onAnomalyAdded, onEditAnomaly, onDeleteAnomaly, highlightedAnomalyId }) => {
  // Modal state for add anomaly
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [imgScale, setImgScale] = React.useState(1);
  const [imgPos, setImgPos] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const imageRef = React.useRef<any>(null);
  const STAGE_WIDTH = 400;
  const STAGE_HEIGHT = 300;

  const COLORS = [
    "#ff5252", // red
    "#4caf50", // green
    "#2196f3", // blue
    "#ff9800", // orange
    "#9c27b0", // purple
    "#00bcd4", // cyan
    "#8bc34a", // light green
    "#e91e63", // pink
  ];

  // Helper to fit image to frame
  const getFittedScaleAndPos = (img: HTMLImageElement) => {
    const scaleX = STAGE_WIDTH / img.width;
    const scaleY = STAGE_HEIGHT / img.height;
    const fitScale = Math.min(scaleX, scaleY, 1);
    return {
      scale: fitScale,
      pos: {
        x: (STAGE_WIDTH - img.width * fitScale) / 2,
        y: (STAGE_HEIGHT - img.height * fitScale) / 2,
      },
    };
  };

  React.useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      const { scale, pos } = getFittedScaleAndPos(img);
      setImgScale(scale);
      setImgPos(pos);
      console.log('=== IMAGE WITH ANOMALIES DEBUG ===');
      console.log('Image natural size:', img.width, 'x', img.height);
      console.log('Canvas size:', STAGE_WIDTH, 'x', STAGE_HEIGHT);
      console.log('Calculated scale:', scale);
      console.log('Image position offset:', pos);
      console.log('Anomalies received:', anomalies);
      if (anomalies && anomalies.length > 0) {
        console.log('First anomaly box (should be [x, y, width, height] in original image pixels):', anomalies[0].box);
      }
    };
  }, [imageUrl]);

  // Filter out anomalies with class 'Normal'
  const filteredAnomalies = (anomalies || []).filter(a => a.class !== 'Normal');
  const showNoAnomalies = !filteredAnomalies || filteredAnomalies.length === 0;

  // Zoom handler for image only
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    if (!image) return;
    const scaleBy = 1.1;
    let newScale = imgScale;
    const oldScale = imgScale;
    const pointer = e.target.getStage().getPointerPosition();
    if (!pointer) return;
    // Calculate mouse point relative to image
    const mousePointTo = {
      x: (pointer.x - imgPos.x) / oldScale,
      y: (pointer.y - imgPos.y) / oldScale,
    };
    if (e.evt.deltaY < 0) {
      newScale = Math.min(imgScale * scaleBy, 5);
    } else {
      newScale = Math.max(imgScale / scaleBy, 1); // Don't allow less than 100%
    }
    // When at 100%, recenter the image
    let newPos = imgPos;
    if (newScale === 1) {
      const scaleX = STAGE_WIDTH / image.width;
      const scaleY = STAGE_HEIGHT / image.height;
      const fitScale = Math.min(scaleX, scaleY, 1);
      newScale = fitScale;
      newPos = {
        x: (STAGE_WIDTH - image.width * fitScale) / 2,
        y: (STAGE_HEIGHT - image.height * fitScale) / 2,
      };
    } else {
      // Keep the point under the mouse stationary
      newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      // Clamp so image never reveals canvas
      const imgWidth = image.width * newScale;
      const imgHeight = image.height * newScale;
      if (imgWidth <= STAGE_WIDTH) {
        newPos.x = (STAGE_WIDTH - imgWidth) / 2;
      } else {
        newPos.x = Math.min(0, Math.max(newPos.x, STAGE_WIDTH - imgWidth));
      }
      if (imgHeight <= STAGE_HEIGHT) {
        newPos.y = (STAGE_HEIGHT - imgHeight) / 2;
      } else {
        newPos.y = Math.min(0, Math.max(newPos.y, STAGE_HEIGHT - imgHeight));
      }
    }
    setImgScale(newScale);
    setImgPos(newPos);
  };

  // Drag handlers for image only
  const handleDragStart = () => setDragging(true);
  const handleDragEnd = (e: any) => {
    setDragging(false);
    if (!image) return;
    const imgWidth = image.width * imgScale;
    const imgHeight = image.height * imgScale;
    let x = e.target.x();
    let y = e.target.y();
    // Clamp so image never reveals canvas
    if (imgWidth <= STAGE_WIDTH) {
      x = (STAGE_WIDTH - imgWidth) / 2;
    } else {
      x = Math.min(0, Math.max(x, STAGE_WIDTH - imgWidth));
    }
    if (imgHeight <= STAGE_HEIGHT) {
      y = (STAGE_HEIGHT - imgHeight) / 2;
    } else {
      y = Math.min(0, Math.max(y, STAGE_HEIGHT - imgHeight));
    }
    setImgPos({ x, y });
  };

  // Reset zoom handler
  const handleResetZoom = () => {
    if (image) {
      const { scale, pos } = getFittedScaleAndPos(image);
      setImgScale(scale);
      setImgPos(pos);
    }
  };

  // Add anomaly handler
  const handleAddAnomaly = async (anomaly: { box: [number, number, number, number]; class: string }) => {
    // Optionally, call API to add anomaly here
    if (onAnomalyAdded) {
      onAnomalyAdded({ ...anomaly, confidence: 1 });
    }
    // You may want to POST to backend here
    setShowAddModal(false);
  };

  return (
    <div style={{ position: 'relative', width: STAGE_WIDTH, height: STAGE_HEIGHT }}>
      {/* Floating Add Anomaly Button (top right) */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          background: '#fff',
          border: '1px solid #bbb',
          borderRadius: '50%',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          cursor: 'pointer',
        }}
        title="Add Anomaly"
      >
        <Plus size={20} />
      </button>

      {/* Floating Reset Zoom Button (bottom right) */}
      <button
        onClick={handleResetZoom}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          zIndex: 10,
          background: '#fff',
          border: '1px solid #bbb',
          borderRadius: '50%',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          cursor: image ? 'pointer' : 'not-allowed',
          opacity: image ? 1 : 0.5,
        }}
        title="Reset Zoom"
        disabled={!image}
      >
        <Maximize2 size={18} />
      </button>

      <Stage
        width={STAGE_WIDTH}
        height={STAGE_HEIGHT}
        onWheel={handleWheel}
        style={{ border: '1px solid #ccc', background: '#222' }}
      >
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={imgPos.x}
              y={imgPos.y}
              scaleX={imgScale}
              scaleY={imgScale}
              draggable
              dragBoundFunc={(pos) => {
                const imgWidth = image.width * imgScale;
                const imgHeight = image.height * imgScale;
                let x = pos.x;
                let y = pos.y;
                if (imgWidth <= STAGE_WIDTH) {
                  x = (STAGE_WIDTH - imgWidth) / 2;
                } else {
                  x = Math.min(0, Math.max(x, STAGE_WIDTH - imgWidth));
                }
                if (imgHeight <= STAGE_HEIGHT) {
                  y = (STAGE_HEIGHT - imgHeight) / 2;
                } else {
                  y = Math.min(0, Math.max(y, STAGE_HEIGHT - imgHeight));
                }
                return { x, y };
              }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              ref={imageRef}
            />
          )}
          {showNoAnomalies && image && (
            <Group>
              <Rect
                x={0}
                y={0}
                width={STAGE_WIDTH}
                height={STAGE_HEIGHT}
                fill="black"
                opacity={0.5}
              />
              <Text
                text="No anomalies"
                fontSize={32}
                fill="white"
                x={STAGE_WIDTH / 2 - 80}
                y={STAGE_HEIGHT / 2 - 16}
              />
            </Group>
          )}
          {!showNoAnomalies && filteredAnomalies.map((anomaly, idx) => {
            const color = COLORS[idx % COLORS.length];
            const isHighlighted = highlightedAnomalyId && anomaly.id && highlightedAnomalyId === anomaly.id;
            if (!image) return null;

            // Backend returns [x_center, y_center, width, height]
            // Convert to [x1, y1, x2, y2] (two corner points in original image pixels)
            const [x_center, y_center, width, height] = anomaly.box;
            const x1 = x_center - width / 2;
            const y1 = y_center - height / 2;
            const x2 = x_center + width / 2;
            const y2 = y_center + height / 2;
            const x = x1;
            const y = y1;
            const w = x2 - x1;
            const h = y2 - y1;

            // Scale to match the displayed image size and add offset
            const displayX = x * imgScale + imgPos.x;
            const displayY = y * imgScale + imgPos.y;
            const displayW = w * imgScale;
            const displayH = h * imgScale;

            // Enhanced debug logging for backend vs user-drawn anomalies
            if (idx === 0) {
              console.log('=== Rendering anomaly #0 ===');
              console.log('  Source:', anomaly.madeBy || 'unknown');
              console.log('  Original box (x_center,y_center,width,height):', anomaly.box);
              console.log('  Converted to x1,y1,x2,y2:', x1, y1, x2, y2);
              console.log('  Converted to x,y,w,h:', x, y, w, h);
              console.log('  Image natural size:', image.width, 'x', image.height);
              console.log('  imgScale:', imgScale);
              console.log('  imgPos:', imgPos);
              console.log('  Displayed image size:', image.width * imgScale, 'x', image.height * imgScale);
              console.log('  Final canvas box:', { x: displayX, y: displayY, width: displayW, height: displayH });
            }

            return (
              <Group key={anomaly.id || idx}>
                <Rect
                  x={displayX}
                  y={displayY}
                  width={displayW}
                  height={displayH}
                  stroke={color}
                  strokeWidth={isHighlighted ? 5 : 3}
                  opacity={isHighlighted ? 1 : 0.9}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {/* Add Anomaly Modal */}
      <AddAnomalyModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAnomaly}
        imageUrl={imageUrl}
        existingAnomalies={anomalies}
        onEditAnomaly={onEditAnomaly}
        onDeleteAnomaly={onDeleteAnomaly}
      />
    </div>
  );
};

// Helper for Konva Image
// import { Image as KonvaImage } from "react-konva";
