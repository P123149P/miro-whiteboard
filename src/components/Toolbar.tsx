import React, { useState } from 'react';
import {
  MousePointer,
  Hand,
  StickyNote,
  Square,
  Circle,
  Diamond,
  Triangle,
  Star,
  Type,
  ArrowRight,
  PenTool,
  Layout,
  Eraser,
  Sparkles,
  ChevronUp,
  ChevronRight,
} from 'lucide-react';
import { ShapeType, ToolType } from '../types';

interface ToolbarProps {
  currentTool: ToolType;
  selectedShape: ShapeType;
  onSelectTool: (tool: ToolType) => void;
  onSelectShape: (shape: ShapeType) => void;
  onOpenTemplates: () => void;
  stickyColor: string;
  onSelectStickyColor: (color: string) => void;
}

const STICKY_COLORS = [
  { name: '黄', color: '#fef08a', border: '#fde047' },
  { name: '蓝', color: '#bae6fd', border: '#7dd3fc' },
  { name: '绿', color: '#bbf7d0', border: '#86efac' },
  { name: '粉', color: '#fbcfe8', border: '#f472b6' },
  { name: '橙', color: '#fed7aa', border: '#fdba74' },
  { name: '紫', color: '#e9d5ff', border: '#d8b4fe' },
];

const SHAPE_OPTIONS: { type: ShapeType; icon: React.ReactNode; label: string }[] = [
  { type: 'rectangle', icon: <Square className="w-4 h-4" />, label: '矩形' },
  { type: 'rounded-rectangle', icon: <Square className="w-4 h-4 rounded-sm" />, label: '圆角矩形' },
  { type: 'circle', icon: <Circle className="w-4 h-4" />, label: '圆形' },
  { type: 'diamond', icon: <Diamond className="w-4 h-4" />, label: '菱形' },
  { type: 'triangle', icon: <Triangle className="w-4 h-4" />, label: '三角形' },
  { type: 'star', icon: <Star className="w-4 h-4" />, label: '五角星' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  selectedShape,
  onSelectTool,
  onSelectShape,
  onOpenTemplates,
  stickyColor,
  onSelectStickyColor,
}) => {
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showStickyMenu, setShowStickyMenu] = useState(false);

  return (
    <div className="fixed md:absolute z-30 flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/80 p-1.5 md:p-2 gap-1 text-slate-700
      /* Mobile: bottom dock centered, Desktop: left vertical dock */
      bottom-3 left-1/2 -translate-x-1/2 md:bottom-auto md:left-6 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col max-w-[94vw] overflow-x-auto select-none"
    >
      {/* Select Tool */}
      <button
        title="选择工具 (V)"
        onClick={() => {
          onSelectTool('select');
          setShowShapeMenu(false);
          setShowStickyMenu(false);
        }}
        className={`p-2 md:p-2.5 rounded-xl transition-all shrink-0 ${
          currentTool === 'select'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <MousePointer className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Hand Tool */}
      <button
        title="平移画布 (H 或 空格+拖拽)"
        onClick={() => {
          onSelectTool('hand');
          setShowShapeMenu(false);
          setShowStickyMenu(false);
        }}
        className={`p-2 md:p-2.5 rounded-xl transition-all shrink-0 ${
          currentTool === 'hand'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <Hand className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <div className="h-4 w-px md:w-6 md:h-px bg-slate-200 my-0.5 md:my-1 shrink-0" />

      {/* Sticky Note Tool */}
      <div className="relative shrink-0">
        <button
          title="便签 (N)"
          onClick={() => {
            onSelectTool('sticky');
            setShowStickyMenu(!showStickyMenu);
            setShowShapeMenu(false);
          }}
          className={`p-2 md:p-2.5 rounded-xl transition-all relative ${
            currentTool === 'sticky'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          <StickyNote className="w-4 h-4 md:w-5 md:h-5" />
          <span
            className="absolute bottom-1 right-1 w-2 md:w-2.5 h-2 md:h-2.5 rounded-full border border-white"
            style={{ backgroundColor: stickyColor }}
          />
        </button>

        {showStickyMenu && (
          <div className="absolute bottom-full mb-3 md:bottom-auto md:left-full md:ml-3 md:top-0 left-1/2 -translate-x-1/2 md:translate-x-0 bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-xl border border-slate-200 flex flex-col gap-1.5 z-50 animate-in fade-in">
            <span className="text-[11px] font-medium text-slate-400 px-1">便签颜色</span>
            <div className="grid grid-cols-3 gap-1.5 w-28">
              {STICKY_COLORS.map((item) => (
                <button
                  key={item.color}
                  onClick={() => {
                    onSelectStickyColor(item.color);
                    onSelectTool('sticky');
                    setShowStickyMenu(false);
                  }}
                  className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${
                    stickyColor === item.color ? 'border-slate-800 scale-105' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: item.color }}
                  title={item.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shapes Tool */}
      <div className="relative shrink-0">
        <button
          title="图形库 (S)"
          onClick={() => {
            onSelectTool('shape');
            setShowShapeMenu(!showShapeMenu);
            setShowStickyMenu(false);
          }}
          className={`p-2 md:p-2.5 rounded-xl transition-all relative ${
            currentTool === 'shape'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          {selectedShape === 'circle' ? (
            <Circle className="w-4 h-4 md:w-5 md:h-5" />
          ) : selectedShape === 'diamond' ? (
            <Diamond className="w-4 h-4 md:w-5 md:h-5" />
          ) : selectedShape === 'triangle' ? (
            <Triangle className="w-4 h-4 md:w-5 md:h-5" />
          ) : selectedShape === 'star' ? (
            <Star className="w-4 h-4 md:w-5 md:h-5" />
          ) : (
            <Square className="w-4 h-4 md:w-5 md:h-5" />
          )}
          <ChevronUp className="w-2.5 h-2.5 absolute -top-0.5 right-1 md:hidden opacity-60" />
          <ChevronRight className="w-3 h-3 absolute -right-0.5 bottom-1 hidden md:block opacity-60" />
        </button>

        {showShapeMenu && (
          <div className="absolute bottom-full mb-3 md:bottom-auto md:left-full md:ml-3 md:top-0 left-1/2 -translate-x-1/2 md:translate-x-0 bg-white/95 backdrop-blur-md rounded-xl p-1.5 shadow-xl border border-slate-200 flex flex-col gap-1 w-36 z-50 animate-in fade-in">
            <span className="text-[11px] font-medium text-slate-400 px-2 py-0.5">选择形状</span>
            {SHAPE_OPTIONS.map((item) => (
              <button
                key={item.type}
                onClick={() => {
                  onSelectShape(item.type);
                  onSelectTool('shape');
                  setShowShapeMenu(false);
                }}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedShape === item.type && currentTool === 'shape'
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text Tool */}
      <button
        title="文本 (T)"
        onClick={() => {
          onSelectTool('text');
          setShowShapeMenu(false);
          setShowStickyMenu(false);
        }}
        className={`p-2 md:p-2.5 rounded-xl transition-all shrink-0 ${
          currentTool === 'text'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <Type className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Connector / Arrow */}
      <button
        title="连接线 / 箭头 (A)"
        onClick={() => {
          onSelectTool('connector');
          setShowShapeMenu(false);
          setShowStickyMenu(false);
        }}
        className={`p-2 md:p-2.5 rounded-xl transition-all shrink-0 ${
          currentTool === 'connector'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Freehand Pen */}
      <button
        title="自由画笔 (P)"
        onClick={() => {
          onSelectTool('pen');
          setShowShapeMenu(false);
          setShowStickyMenu(false);
        }}
        className={`p-2 md:p-2.5 rounded-xl transition-all shrink-0 ${
          currentTool === 'pen'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <PenTool className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Frame / Section */}
      <button
        title="框架分区 (F)"
        onClick={() => {
          onSelectTool('frame');
          setShowShapeMenu(false);
          setShowStickyMenu(false);
        }}
        className={`p-2 md:p-2.5 rounded-xl transition-all shrink-0 ${
          currentTool === 'frame'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <Layout className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      {/* Eraser */}
      <button
        title="橡皮擦 (E)"
        onClick={() => {
          onSelectTool('eraser');
          setShowShapeMenu(false);
          setShowStickyMenu(false);
        }}
        className={`p-2 md:p-2.5 rounded-xl transition-all shrink-0 ${
          currentTool === 'eraser'
            ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
            : 'hover:bg-slate-100 text-slate-600'
        }`}
      >
        <Eraser className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <div className="h-4 w-px md:w-6 md:h-px bg-slate-200 my-0.5 md:my-1 shrink-0" />

      {/* Templates library */}
      <button
        title="模板库 (Templates)"
        onClick={onOpenTemplates}
        className="p-2 md:p-2.5 rounded-xl text-purple-600 hover:bg-purple-50 transition-all shrink-0 group relative"
      >
        <Sparkles className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
};
