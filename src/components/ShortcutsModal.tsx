import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'V', desc: '选择工具 (Select)' },
  { key: 'H', desc: '手形平移 (Hand)' },
  { key: 'N', desc: '快速放置便签 (Sticky Note)' },
  { key: 'S / R', desc: '形状工具 (Shape / Rectangle)' },
  { key: 'T', desc: '插入文本 (Text)' },
  { key: 'A', desc: '智能连线 / 箭头 (Arrow / Connector)' },
  { key: 'P', desc: '手绘画笔 (Pen)' },
  { key: 'F', desc: '画框分区 (Frame)' },
  { key: 'E', desc: '橡皮擦 (Eraser)' },
  { key: 'Space + 拖拽', desc: '自由漫游平移画布' },
  { key: '滚轮', desc: '平滑缩放画布' },
  { key: '双击元素', desc: '直接编辑内部文字' },
  { key: 'Ctrl + Z', desc: '撤销上一步操作' },
  { key: 'Ctrl + Y', desc: '重做下一步操作' },
  { key: 'Ctrl + D', desc: '快速复制选中元素副本' },
  { key: 'Delete / Backspace', desc: '删除当前选中元素' },
  { key: 'Shift + 点击', desc: '多选或切换选中' },
  { key: '框选区域', desc: '批量选中多个元素' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 overflow-hidden flex flex-col gap-4 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">快捷键指南</h2>
              <p className="text-xs text-slate-500">掌握快捷键，让白板构思如行云流水</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
            >
              <span className="text-slate-600">{item.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono font-semibold text-slate-800 text-[11px] shadow-2xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
