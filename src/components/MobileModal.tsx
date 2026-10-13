import React, { useEffect, useState } from 'react';
import { X, Smartphone, QrCode, CheckCircle2, Download, Copy, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileModal: React.FC<MobileModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // LAN URL for phone access
  const lanUrl = 'http://192.168.10.2:5173/';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(lanUrl, {
        width: 220,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [isOpen, lanUrl]);

  if (!isOpen) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 overflow-hidden flex flex-col gap-5 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">在安卓手机上运行使用</h2>
              <p className="text-xs text-slate-500">双指手势缩放、原生触控、支持一键安装为独立 App</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-4 text-center">
          {/* QR Code */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="手机局域网访问二维码"
                className="w-48 h-48 rounded-xl shadow-xs"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                生成二维码中...
              </div>
            )}
            <span className="text-[11px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" />
              手机与电脑在同一 Wi-Fi 下，扫码即用
            </span>
          </div>

          {/* URL Copy */}
          <div className="w-full flex items-center justify-between bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs">
            <span className="font-mono text-slate-700 select-all truncate">{lanUrl}</span>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors shrink-0 font-medium"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制网址'}</span>
            </button>
          </div>

          {/* Install instructions */}
          <div className="w-full text-left bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-amber-600" />
              如何将白板变成安卓手机桌面 App：
            </h4>
            <ol className="list-decimal list-inside text-amber-950/90 space-y-1.5 leading-relaxed">
              <li>
                用安卓手机自带浏览器、Chrome 或 Edge 打开上述网址。
              </li>
              <li>
                点击浏览器菜单栏（右上角或底部三个点 <span className="font-bold">⋮</span>）。
              </li>
              <li>
                点击 <span className="font-semibold text-blue-700 bg-white/80 px-1.5 py-0.5 rounded border border-amber-300">“添加到主屏幕”</span> 或 <span className="font-semibold text-blue-700 bg-white/80 px-1.5 py-0.5 rounded border border-amber-300">“安装应用”</span>。
              </li>
              <li>
                桌面即会出现独立的 <span className="font-bold">MiroBoard</span> 图标，启动后全屏无地址栏，如同原生安卓软件！
              </li>
            </ol>
          </div>

          <div className="w-full text-left bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600">
            <span className="font-bold text-slate-800">📦 Android Studio 原生工程已就绪：</span>
            <p className="mt-1 text-slate-500 leading-relaxed font-mono text-[11px]">
              项目目录下已自动创建 <span className="text-blue-600 font-semibold">android/</span> 原生安卓工程（基于 Capacitor），支持随时在 Android Studio 中打开并构建签名发布成 <span className="text-slate-800 font-semibold">.apk</span> 安装包。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
