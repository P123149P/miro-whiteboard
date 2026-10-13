import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, MapPin } from 'lucide-react';
import { Camera } from '../types';

interface ZoomControlsProps {
  camera: Camera;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
  showMinimap: boolean;
  onToggleMinimap: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  camera,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent,
  showMinimap,
  onToggleMinimap,
}) => {
  const percentage = Math.round(camera.zoom * 100);

  return (
    <div className="fixed md:absolute bottom-16 md:bottom-6 right-3 md:right-6 z-30 flex items-center bg-white/95 backdrop-blur-md px-1.5 md:px-2 py-1 rounded-2xl shadow-lg border border-slate-200/80 gap-0.5 md:gap-1 text-slate-700">
      <button
        title="缩小 (Ctrl + -)"
        onClick={onZoomOut}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <ZoomOut className="w-4 h-4 text-slate-600" />
      </button>

      <button
        title="重置缩放 (100%)"
        onClick={onResetZoom}
        className="px-2 py-1 text-xs font-mono font-medium hover:bg-slate-100 rounded-lg transition-colors w-14 text-center"
      >
        {percentage}%
      </button>

      <button
        title="放大 (Ctrl + +)"
        onClick={onZoomIn}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <ZoomIn className="w-4 h-4 text-slate-600" />
      </button>

      <div className="w-px h-4 bg-slate-200 my-auto" />

      <button
        title="适应画布全部元素 (Shift + 1)"
        onClick={onFitToContent}
        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      <button
        title="切换鹰眼缩略小地图"
        onClick={onToggleMinimap}
        className={`p-1.5 rounded-lg transition-colors ${
          showMinimap ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <MapPin className="w-4 h-4" />
      </button>
    </div>
  );
};
