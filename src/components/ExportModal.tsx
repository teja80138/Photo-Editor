import React, { useState } from 'react';
import { X, Download, Copy, Check, FileImage, ShieldCheck } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  canvasRef,
}) => {
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(92);
  const [scale, setScale] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [filename, setFilename] = useState('lumina-edited-photo');

  if (!isOpen) return null;

  const canvas = canvasRef.current;
  const originalWidth = canvas?.width || 1200;
  const originalHeight = canvas?.height || 800;

  const exportWidth = Math.round(originalWidth * scale);
  const exportHeight = Math.round(originalHeight * scale);

  const getExportCanvas = () => {
    if (!canvas) return null;
    if (scale === 1) return canvas;

    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = exportWidth;
    scaledCanvas.height = exportHeight;
    const ctx = scaledCanvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, exportWidth, exportHeight);
    }
    return scaledCanvas;
  };

  const handleDownload = () => {
    const exportCanvas = getExportCanvas();
    if (!exportCanvas) return;

    const mimeType =
      format === 'png'
        ? 'image/png'
        : format === 'jpeg'
        ? 'image/jpeg'
        : 'image/webp';

    const dataUrl = exportCanvas.toDataURL(mimeType, quality / 100);
    const link = document.createElement('a');
    link.download = `${filename || 'photo'}.${format}`;
    link.href = dataUrl;
    link.click();
    onClose();
  };

  const handleCopyToClipboard = async () => {
    const exportCanvas = getExportCanvas();
    if (!exportCanvas) return;

    try {
      exportCanvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Clipboard copy not permitted:', err);
    }
  };

  return (
    <div
      id="export-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="export-modal"
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Export Artwork
              </h3>
              <p className="text-xs text-neutral-400">
                Save your high-fidelity edited image
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-neutral-400">
            Image Format
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'png' as const, label: 'PNG', desc: 'Lossless & Alpha' },
              { id: 'jpeg' as const, label: 'JPEG', desc: 'Lightweight' },
              { id: 'webp' as const, label: 'WebP', desc: 'Modern' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setFormat(fmt.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  format === fmt.id
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold">{fmt.label}</div>
                <div className="text-[10px] text-neutral-500">{fmt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Scale */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-neutral-400">
            Resolution Scale
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 0.5, label: '0.5x Web' },
              { val: 1, label: '1x Original' },
              { val: 2, label: '2x Ultra-HD' },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => setScale(s.val)}
                className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                  scale === s.val
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">
            Output Dimensions: {exportWidth} × {exportHeight} px
          </p>
        </div>

        {/* Quality Slider for JPEG / WebP */}
        {format !== 'png' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-medium">
                Compression Quality
              </span>
              <span className="font-mono text-neutral-300">{quality}%</span>
            </div>
            <input
              type="range"
              min={40}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        )}

        {/* Filename Input */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-neutral-400">
            File Name
          </span>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full text-xs p-2 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-neutral-200"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleCopyToClipboard}
            className="flex-1 py-2.5 px-3 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
