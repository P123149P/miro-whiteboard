import React from 'react';
import { X, Sparkles, PlusCircle } from 'lucide-react';
import { PRESET_TEMPLATES } from '../utils/templates';
import { CanvasElement } from '../types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (elements: CanvasElement[]) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 overflow-hidden flex flex-col gap-5 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">精选白板模板库</h2>
              <p className="text-xs text-slate-500">一键导入工业级设计与协作模板，快速开展工作</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {PRESET_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => {
                onSelectTemplate(tpl.elements);
                onClose();
              }}
              className="group p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
                    {tpl.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {tpl.elements.length} 个元素
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {tpl.description}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600 opacity-80 group-hover:opacity-100">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>载入此模板</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
