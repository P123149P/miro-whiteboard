import React, { useRef } from 'react';
import { Camera, CanvasElement } from '../types';
import { getElementBounds, getMultiElementBounds } from '../utils/geometry';

interface MinimapProps {
  elements: CanvasElement[];
  camera: Camera;
  onNavigate: (worldX: number, worldY: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({ elements, camera, onNavigate }) => {
  const mapWidth = 180;
  const mapHeight = 120;
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute world bounding area including elements + current viewport
  const elementsBounds = getMultiElementBounds(elements);
  const viewportWorldWidth = window.innerWidth / camera.zoom;
  const viewportWorldHeight = window.innerHeight / camera.zoom;
  const viewportWorldX = -camera.x / camera.zoom;
  const viewportWorldY = -camera.y / camera.zoom;

  const minX = Math.min(elementsBounds?.x ?? 0, viewportWorldX) - 200;
  const minY = Math.min(elementsBounds?.y ?? 0, viewportWorldY) - 200;
  const maxX = Math.max((elementsBounds?.x ?? 0) + (elementsBounds?.width ?? 800), viewportWorldX + viewportWorldWidth) + 200;
  const maxY = Math.max((elementsBounds?.y ?? 0) + (elementsBounds?.height ?? 600), viewportWorldY + viewportWorldHeight) + 200;

  const totalWorldW = Math.max(maxX - minX, 1000);
  const totalWorldH = Math.max(maxY - minY, 800);

  const scale = Math.min(mapWidth / totalWorldW, mapHeight / totalWorldH);

  // Convert world coordinates to minimap pixel coordinates
  const toMapX = (wx: number) => (wx - minX) * scale;
  const toMapY = (wy: number) => (wy - minY) * scale;

  const vpX = toMapX(viewportWorldX);
  const vpY = toMapY(viewportWorldY);
  const vpW = viewportWorldWidth * scale;
  const vpH = viewportWorldHeight * scale;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickMapX = e.clientX - rect.left;
    const clickMapY = e.clientY - rect.top;

    const targetWorldX = clickMapX / scale + minX;
    const targetWorldY = clickMapY / scale + minY;

    onNavigate(targetWorldX, targetWorldY);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{ width: mapWidth, height: mapHeight }}
      className="absolute bottom-20 right-6 z-20 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 overflow-hidden cursor-crosshair select-none animate-in fade-in slide-in-from-bottom-2"
    >
      <svg className="w-full h-full pointer-events-none">
        {/* Elements previews */}
        {elements.map((el) => {
          const bounds = getElementBounds(el);
          const x = toMapX(bounds.minX);
          const y = toMapY(bounds.minY);
          const w = Math.max(bounds.width * scale, 2);
          const h = Math.max(bounds.height * scale, 2);

          let color = '#94a3b8';
          if (el.type === 'sticky') color = el.color;
          if (el.type === 'shape') color = el.fillColor;
          if (el.type === 'frame') color = '#e2e8f0';

          return (
            <rect
              key={el.id}
              x={x}
              y={y}
              width={w}
              height={h}
              rx={1}
              fill={color}
              stroke="#64748b"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Current Camera Viewport outline */}
        <rect
          x={vpX}
          y={vpY}
          width={vpW}
          height={vpH}
          fill="rgba(59, 130, 246, 0.15)"
          stroke="#3b82f6"
          strokeWidth={1.5}
          rx={2}
        />
      </svg>
    </div>
  );
};
