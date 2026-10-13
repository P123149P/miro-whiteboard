import React, { useState } from 'react';
import {
  Palette,
  Type,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  BringToFront,
  SendToBack,
  Minus,
  Spline,
  GitCommit,
} from 'lucide-react';
import { Camera, CanvasElement, ConnectorType, SelectionBounds } from '../types';
import { worldToScreen } from '../utils/geometry';

interface ContextToolbarProps {
  selectedElements: CanvasElement[];
  selectionBounds: SelectionBounds | null;
  camera: Camera;
  onUpdateElement: (updater: (el: CanvasElement) => CanvasElement) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

const PRESET_COLORS = [
  '#fef08a', // Yellow
  '#bae6fd', // Blue
  '#bbf7d0', // Green
  '#fbcfe8', // Pink
  '#fed7aa', // Orange
  '#e9d5ff', // Purple
  '#ffffff', // White
  '#f1f5f9', // Slate
  '#fee2e2', // Red
];

const STROKE_COLORS = [
  '#000000',
  '#64748b',
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#d97706',
  '#9333ea',
];

export const ContextToolbar: React.FC<ContextToolbarProps> = ({
  selectedElements,
  selectionBounds,
  camera,
  onUpdateElement,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStrokePicker, setShowStrokePicker] = useState(false);

  if (!selectionBounds || selectedElements.length === 0) return null;

  // Compute screen coordinates for floating bar (above the bounding box)
  const screenPos = worldToScreen({ x: selectionBounds.x + selectionBounds.width / 2, y: selectionBounds.y }, camera);
  const isSingle = selectedElements.length === 1;
  const single = isSingle ? selectedElements[0] : null;

  return (
    <div
      className="absolute z-40 flex items-center bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 px-2 py-1.5 gap-1.5 text-slate-700 animate-in fade-in zoom-in-95 pointer-events-auto"
      style={{
        left: `${screenPos.x}px`,
        top: `${Math.max(screenPos.y - 56, 70)}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Fill Color Picker */}
      <div className="relative">
        <button
          title="填充颜色"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowStrokePicker(false);
          }}
          className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 text-xs font-medium"
        >
          <Palette className="w-4 h-4 text-slate-600" />
          <span
            className="w-4 h-4 rounded-full border border-slate-300"
            style={{
              backgroundColor:
                single?.type === 'sticky'
                  ? single.color
                  : single?.type === 'shape'
                  ? single.fillColor
                  : single?.type === 'frame'
                  ? single.fillColor
                  : '#3b82f6',
            }}
          />
        </button>

        {showColorPicker && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-xl p-2 shadow-xl border border-slate-200 grid grid-cols-3 gap-1.5 w-32 z-50">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onUpdateElement((el) => {
                    if (el.type === 'sticky') return { ...el, color };
                    if (el.type === 'shape') return { ...el, fillColor: color };
                    if (el.type === 'frame') return { ...el, fillColor: color };
                    return el;
                  });
                  setShowColorPicker(false);
                }}
                className="w-7 h-7 rounded-lg border border-slate-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stroke / Border Settings (for shapes or connectors) */}
      {(single?.type === 'shape' || single?.type === 'connector' || single?.type === 'pen') && (
        <div className="relative">
          <button
            title="边框与线条设置"
            onClick={() => {
              setShowStrokePicker(!showStrokePicker);
              setShowColorPicker(false);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 text-xs font-medium"
          >
            <div className="w-4 h-4 border-2 border-slate-700 rounded-sm" />
          </button>

          {showStrokePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl p-2.5 shadow-xl border border-slate-200 flex flex-col gap-2 w-40 z-50">
              <span className="text-[11px] font-medium text-slate-400">线条粗细</span>
              <div className="flex gap-1.5">
                {[1, 2, 4].map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      onUpdateElement((el) => {
                        if ('strokeWidth' in el) return { ...el, strokeWidth: w };
                        return el;
                      });
                    }}
                    className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium text-center"
                  >
                    {w}px
                  </button>
                ))}
              </div>

              <span className="text-[11px] font-medium text-slate-400">线条样式</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    onUpdateElement((el) => {
                      if ('strokeStyle' in el) return { ...el, strokeStyle: 'solid' };
                      return el;
                    });
                  }}
                  className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium"
                >
                  实线
                </button>
                <button
                  onClick={() => {
                    onUpdateElement((el) => {
                      if ('strokeStyle' in el) return { ...el, strokeStyle: 'dashed' };
                      return el;
                    });
                  }}
                  className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium"
                >
                  虚线
                </button>
              </div>

              <span className="text-[11px] font-medium text-slate-400">线条颜色</span>
              <div className="grid grid-cols-4 gap-1.5">
                {STROKE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onUpdateElement((el) => {
                        if ('strokeColor' in el) return { ...el, strokeColor: c };
                        return el;
                      });
                      setShowStrokePicker(false);
                    }}
                    className="w-6 h-6 rounded-full border border-slate-300 hover:scale-110"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connector type options */}
      {single?.type === 'connector' && (
        <>
          <div className="w-px h-4 bg-slate-200" />
          <button
            title="直线"
            onClick={() => {
              onUpdateElement((el) => (el.type === 'connector' ? { ...el, connectorType: 'straight' } : el));
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-100 ${
              single.connectorType === 'straight' ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            title="平滑曲线"
            onClick={() => {
              onUpdateElement((el) => (el.type === 'connector' ? { ...el, connectorType: 'curved' } : el));
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-100 ${
              single.connectorType === 'curved' ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <Spline className="w-4 h-4" />
          </button>
          <button
            title="折线"
            onClick={() => {
              onUpdateElement((el) => (el.type === 'connector' ? { ...el, connectorType: 'orthogonal' } : el));
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-100 ${
              single.connectorType === 'orthogonal' ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <GitCommit className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Typography Controls */}
      {(single?.type === 'sticky' || single?.type === 'shape' || single?.type === 'text') && (
        <>
          <div className="w-px h-4 bg-slate-200" />
          {/* Font Size controls */}
          <div className="flex items-center gap-1 text-xs">
            <Type className="w-3.5 h-3.5 text-slate-400" />
            <button
              title="减小字号"
              onClick={() => {
                onUpdateElement((el) => {
                  if ('fontSize' in el && el.fontSize) {
                    return { ...el, fontSize: Math.max(el.fontSize - 2, 10) };
                  }
                  return el;
                });
              }}
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 font-bold"
            >
              -
            </button>
            <span className="w-5 text-center font-mono">
              {'fontSize' in single ? single.fontSize ?? 14 : 14}
            </span>
            <button
              title="增大字号"
              onClick={() => {
                onUpdateElement((el) => {
                  if ('fontSize' in el && el.fontSize) {
                    return { ...el, fontSize: Math.min(el.fontSize + 2, 48) };
                  }
                  return el;
                });
              }}
              className="px-1.5 py-0.5 rounded hover:bg-slate-100 font-bold"
            >
              +
            </button>
          </div>

          {/* Text Alignment */}
          <button
            title="左对齐"
            onClick={() => {
              onUpdateElement((el) => ('textAlign' in el ? { ...el, textAlign: 'left' } : el));
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            title="居中对齐"
            onClick={() => {
              onUpdateElement((el) => ('textAlign' in el ? { ...el, textAlign: 'center' } : el));
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            title="右对齐"
            onClick={() => {
              onUpdateElement((el) => ('textAlign' in el ? { ...el, textAlign: 'right' } : el));
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      <div className="w-px h-4 bg-slate-200" />

      {/* Layer Ordering */}
      <button
        title="置于顶层"
        onClick={onBringToFront}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
      >
        <BringToFront className="w-4 h-4" />
      </button>
      <button
        title="置于底层"
        onClick={onSendToBack}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
      >
        <SendToBack className="w-4 h-4" />
      </button>

      {/* Duplicate */}
      <button
        title="创建副本 (Ctrl+D)"
        onClick={onDuplicate}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
      >
        <Copy className="w-4 h-4" />
      </button>

      {/* Delete */}
      <button
        title="删除 (Delete / Backspace)"
        onClick={onDelete}
        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
