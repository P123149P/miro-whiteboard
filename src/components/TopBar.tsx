import React, { useRef, useState } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  Grid3X3,
  Trash2,
  HelpCircle,
  Sparkles,
  FileDown,
  Image as ImageIcon,
  FileCode,
  Smartphone,
} from 'lucide-react';
import { CanvasElement } from '../types';
import { exportToPng, exportToSvg, exportToJson, importFromJson } from '../utils/export';

interface TopBarProps {
  boardTitle: string;
  onUpdateTitle: (title: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  elements: CanvasElement[];
  onImportElements: (elements: CanvasElement[]) => void;
  onClearCanvas: () => void;
  onOpenTemplates: () => void;
  onOpenShortcuts: () => void;
  onOpenMobile: () => void;
  gridType: 'dots' | 'lines' | 'none';
  onToggleGrid: (type: 'dots' | 'lines' | 'none') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  boardTitle,
  onUpdateTitle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  elements,
  onImportElements,
  onClearCanvas,
  onOpenTemplates,
  onOpenShortcuts,
  onOpenMobile,
  gridType,
  onToggleGrid,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showGridMenu, setShowGridMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromJson(file);
      onImportElements(imported);
    } catch (err) {
      alert((err as Error).message || '导入文件失败');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <header className="absolute top-3 left-3 right-3 md:top-4 md:left-6 md:right-6 z-30 flex items-center justify-between pointer-events-none gap-2">
      {/* Left: Miro Brand + Title + Undo/Redo */}
      <div className="flex items-center gap-2 md:gap-3 bg-white/95 backdrop-blur-md px-2.5 py-1.5 md:px-3.5 md:py-2 rounded-2xl shadow-lg border border-slate-200/80 pointer-events-auto min-w-0">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 flex items-center justify-center shadow-inner font-black text-amber-900 text-base md:text-lg tracking-tighter shrink-0">
          M
        </div>

        <div className="min-w-0 max-w-[120px] sm:max-w-[200px] md:max-w-xs">
          {isEditingTitle ? (
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => onUpdateTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              className="text-xs md:text-sm font-semibold text-slate-800 border-b border-blue-500 outline-none px-1 py-0.5 bg-transparent w-full"
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="text-xs md:text-sm font-semibold text-slate-800 hover:text-blue-600 cursor-pointer px-1 py-0.5 rounded transition-colors truncate block"
              title="点击重命名白板"
            >
              {boardTitle}
            </span>
          )}
        </div>

        <div className="w-px h-4 bg-slate-200 hidden sm:block" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 md:gap-1">
          <button
            title="撤销 (Ctrl+Z)"
            disabled={!canUndo}
            onClick={onUndo}
            className={`p-1 md:p-1.5 rounded-lg transition-colors ${
              canUndo ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
          <button
            title="重做 (Ctrl+Y)"
            disabled={!canRedo}
            onClick={onRedo}
            className={`p-1 md:p-1.5 rounded-lg transition-colors ${
              canRedo ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 md:gap-2 bg-white/95 backdrop-blur-md px-2 py-1.5 md:px-3 md:py-1.5 rounded-2xl shadow-lg border border-slate-200/80 pointer-events-auto">
        {/* Mobile / Android App guide button */}
        <button
          onClick={onOpenMobile}
          className="flex items-center gap-1 text-[11px] md:text-xs font-semibold px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors shadow-2xs"
          title="手机扫码在安卓设备上使用"
        >
          <Smartphone className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600" />
          <span>手机版</span>
        </button>

        {/* Templates quick button */}
        <button
          onClick={onOpenTemplates}
          className="hidden sm:flex items-center gap-1 text-xs font-medium px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl text-purple-600 hover:bg-purple-50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
          <span>模板库</span>
        </button>

        {/* Grid Switch */}
        <div className="relative">
          <button
            title="画布网格设置"
            onClick={() => setShowGridMenu(!showGridMenu)}
            className="p-1 md:p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Grid3X3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>

          {showGridMenu && (
            <div className="absolute right-0 mt-2 bg-white rounded-xl p-1.5 shadow-xl border border-slate-200 flex flex-col gap-1 w-28 z-50 animate-in fade-in">
              <button
                onClick={() => {
                  onToggleGrid('dots');
                  setShowGridMenu(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                  gridType === 'dots' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                点状网格
              </button>
              <button
                onClick={() => {
                  onToggleGrid('lines');
                  setShowGridMenu(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                  gridType === 'lines' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                方格线条
              </button>
              <button
                onClick={() => {
                  onToggleGrid('none');
                  setShowGridMenu(false);
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                  gridType === 'none' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                无网格
              </button>
            </div>
          )}
        </div>

        {/* Export / Share Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1 md:gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1 md:px-3 md:py-1.5 rounded-xl shadow-xs transition-all"
          >
            <Download className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden sm:inline">导出</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 bg-white rounded-xl p-1.5 shadow-xl border border-slate-200 flex flex-col gap-1 w-44 z-50 animate-in fade-in">
              <button
                onClick={() => {
                  exportToPng(elements, boardTitle);
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 text-slate-700"
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>导出为 PNG 图片</span>
              </button>
              <button
                onClick={() => {
                  exportToSvg(elements, boardTitle);
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 text-slate-700"
              >
                <FileCode className="w-4 h-4 text-orange-500" />
                <span>导出为 SVG 矢量图</span>
              </button>
              <button
                onClick={() => {
                  exportToJson(elements, boardTitle);
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 text-slate-700"
              >
                <FileDown className="w-4 h-4 text-blue-500" />
                <span>保存工程 (JSON)</span>
              </button>
              <div className="w-full h-px bg-slate-100 my-0.5" />
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowExportMenu(false);
                }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-100 text-slate-700"
              >
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>导入工程文件</span>
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Clear Board */}
        <button
          title="清空白板"
          onClick={() => {
            if (confirm('确认清空当前白板上的所有内容？')) {
              onClearCanvas();
            }
          }}
          className="p-1 md:p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>

        {/* Shortcuts / Help */}
        <button
          title="快捷键与使用说明"
          onClick={onOpenShortcuts}
          className="p-1 md:p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors hidden sm:block"
        >
          <HelpCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      </div>
    </header>
  );
};
