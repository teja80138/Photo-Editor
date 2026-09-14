import React, { useRef } from 'react';
import {
  Undo2,
  Redo2,
  RotateCcw,
  Sparkles,
  Download,
  Upload,
  SplitSquareVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';

interface HeaderProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onOpenSamplePicker: () => void;
  onOpenExport: () => void;
  onImageUpload: (file: File) => void;
  compareMode: boolean;
  onToggleCompare: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  activeHistoryLabel?: string;
  isProcessing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onOpenSamplePicker,
  onOpenExport,
  onImageUpload,
  compareMode,
  onToggleCompare,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  activeHistoryLabel,
  isProcessing = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <header
      id="app-header"
      className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none"
    >
      {/* Brand & Studio Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-neutral-100">
              AI Photo Studio
            </h1>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Gemini 3.1 Flash
            </span>
          </div>
          {activeHistoryLabel && (
            <p className="text-[11px] text-neutral-400 truncate max-w-[200px]">
              {activeHistoryLabel}
            </p>
          )}
        </div>
      </div>

      {/* Center Tools: History, Compare, Zoom */}
      <div className="flex items-center gap-1.5 bg-neutral-950/60 p-1 rounded-lg border border-neutral-800/80">
        {/* Undo */}
        <button
          id="btn-undo"
          onClick={onUndo}
          disabled={!canUndo || isProcessing}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          id="btn-redo"
          onClick={onRedo}
          disabled={!canRedo || isProcessing}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-0.5" />

        {/* Before / After Split Slider Toggle */}
        <button
          id="btn-compare"
          onClick={onToggleCompare}
          title="Before / After Split View"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            compareMode
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Split Compare</span>
        </button>

        {/* Reset */}
        <button
          id="btn-reset"
          onClick={onReset}
          disabled={isProcessing}
          title="Reset All Adjustments"
          className="p-1.5 rounded-md text-neutral-300 hover:text-rose-400 hover:bg-neutral-800 disabled:opacity-30 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-neutral-800 mx-0.5" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 text-xs text-neutral-400">
          <button
            id="btn-zoom-out"
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-zoom-reset"
            onClick={onZoomReset}
            title="Fit to Screen"
            className="px-1.5 py-1 rounded text-[11px] font-mono hover:bg-neutral-800 text-neutral-300 transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            id="btn-zoom-in"
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Right Actions: Samples, Upload, Export */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Sample Library */}
        <button
          id="btn-samples"
          onClick={onOpenSamplePicker}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Sample Photos</span>
        </button>

        {/* Upload Button */}
        <button
          id="btn-upload"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Export Button */}
        <button
          id="btn-export"
          onClick={onOpenExport}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 active:scale-95 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
