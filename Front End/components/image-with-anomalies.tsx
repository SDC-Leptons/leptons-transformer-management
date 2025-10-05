import React from "react";
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage } from "react-konva";

interface Anomaly {
  box: [number, number, number, number];
  confidence: number;
  class: string;
}

interface ImageWithAnomaliesProps {
  imageUrl: string;
  anomalies: Anomaly[];
}

export const ImageWithAnomalies: React.FC<ImageWithAnomaliesProps> = ({ imageUrl, anomalies }) => {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [imgScale, setImgScale] = React.useState(1);
  const [imgPos, setImgPos] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const imageRef = React.useRef<any>(null);
  const STAGE_WIDTH = 400;
  const STAGE_HEIGHT = 300;

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

  return (
    <div>
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
          {!showNoAnomalies && filteredAnomalies.map((anomaly, idx) => (
            <Group key={idx}>
              <Rect
                x={anomaly.box[0] * imgScale + imgPos.x}
                y={anomaly.box[1] * imgScale + imgPos.y}
                width={(anomaly.box[2] - anomaly.box[0]) * imgScale}
                height={(anomaly.box[3] - anomaly.box[1]) * imgScale}
                stroke="red"
                strokeWidth={3}
              />
              <Text
                text={`${anomaly.class} (${(anomaly.confidence * 100).toFixed(1)}%)`}
                x={anomaly.box[0] * imgScale + imgPos.x}
                y={anomaly.box[1] * imgScale + imgPos.y - 24}
                fontSize={18}
                fill="yellow"
                fontStyle="bold"
              />
            </Group>
          ))}
        </Layer>
      </Stage>
      {/* Reset Zoom Button */}
      <div style={{ marginTop: 10, textAlign: 'right' }}>
        <button
          onClick={handleResetZoom}
          style={{
            padding: '6px 16px',
            background: '#f3f3f3',
            border: '1px solid #bbb',
            borderRadius: 4,
            cursor: image ? 'pointer' : 'not-allowed',
            fontWeight: 500,
            color: '#222',
            marginBottom: 8,
          }}
          disabled={!image}
        >
          Reset Zoom
        </button>
      </div>
      {/* Anomaly List Below Image */}
      {(anomalies && anomalies.length > 0) && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Anomalies</div>
          <div style={{ border: '1px solid #eee', borderRadius: 4, overflow: 'hidden' }}>
            {anomalies.map((anomaly, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #eee', background: anomaly.class === 'Normal' ? '#f6f6f6' : '#fff' }}>
                <span style={{ flex: 1, fontWeight: 500 }}>{anomaly.class}</span>
                <span style={{ flex: 2, color: '#666', fontSize: 13 }}>Box: [{anomaly.box.map((v: number) => v.toFixed(1)).join(', ')}]</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button title="Edit" style={{ padding: '2px 8px', border: '1px solid #bbb', borderRadius: 3, background: '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                  </button>
                  <button title="Delete" style={{ padding: '2px 8px', border: '1px solid #bbb', borderRadius: 3, background: '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                  <button title="Refresh" style={{ padding: '2px 8px', border: '1px solid #bbb', borderRadius: 3, background: '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M1 20a11 11 0 0 0 17.9-4"/><polyline points="1 20 1 14 7 14"/><path d="M23 4a11 11 0 0 0-17.9 4"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for Konva Image
// import { Image as KonvaImage } from "react-konva";
