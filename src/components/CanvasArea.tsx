import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles, Move, Scissors, RefreshCw } from 'lucide-react';
import { CropRect } from '../types';

interface CanvasAreaProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  originalImage: HTMLImageElement | null;
  compareMode: boolean;
  zoom: number;
  isProcessing: boolean;
  processingMessage: string;
  // Inpainting tool props
  isInpaintMode: boolean;
  brushSize: number;
  brushColor: string;
  isEraser: boolean;
  maskCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  onMaskChange?: () => void;
  // Crop tool props
  isCropMode: boolean;
  cropRect: CropRect | null;
  onCropRectChange: (newCrop: CropRect | null) => void;
  aspectRatio: string;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  canvasRef,
  originalImage,
  compareMode,
  zoom,
  isProcessing,
  processingMessage,
  isInpaintMode,
  brushSize,
  isEraser,
  maskCanvasRef,
  onMaskChange,
  isCropMode,
  cropRect,
  onCropRectChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPos, setSplitPos] = useState(50); // percentage 0 - 100
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Pan offsets
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Inpaint drawing state
  const [isDrawingMask, setIsDrawingMask] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  // Synchronize mask canvas size with main canvas
  useEffect(() => {
    const mainCanvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (mainCanvas && maskCanvas) {
      if (
        maskCanvas.width !== mainCanvas.width ||
        maskCanvas.height !== mainCanvas.height
      ) {
        maskCanvas.width = mainCanvas.width;
        maskCanvas.height = mainCanvas.height;
      }
    }
  }, [canvasRef.current?.width, canvasRef.current?.height]);

  // Handle Split Divider Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSplit && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const pct = Math.max(5, Math.min(95, (rawX / rect.width) * 100));
        setSplitPos(pct);
      }
      if (isPanning) {
        setPanOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
      setIsPanning(false);
    };

    if (isDraggingSplit || isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplit, isPanning, dragStart]);

  // Inpainting brush mask drawing handlers
  const startDrawingMask = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInpaintMode) return;
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const rect = maskCanvas.getBoundingClientRect();
    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize * scaleX;

    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.7)'; // Translucent Red for visibility
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    }

    ctx.arc(x, y, (brushSize * scaleX) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);

    setIsDrawingMask(true);
  };

  const drawMask = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const rect = maskCanvas.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (!isDrawingMask || !isInpaintMode) return;
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;

    const scaleX = maskCanvas.width / rect.width;
    const scaleY = maskCanvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingMask = () => {
    if (isDrawingMask) {
      setIsDrawingMask(false);
      onMaskChange?.();
    }
  };

  return (
    <div
      ref={containerRef}
      id="canvas-viewport"
      className="relative flex-1 h-full bg-neutral-950 overflow-hidden flex items-center justify-center select-none"
      onMouseDown={(e) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
          // Middle click or Alt+click pans
          setIsPanning(true);
          setDragStart({
            x: e.clientX - panOffset.x,
            y: e.clientY - panOffset.y,
          });
        }
      }}
    >
      {/* Background Checkerboard pattern for transparency */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#3f3f46 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Main Scaled Canvas Stage */}
      <div
        className="relative transition-transform duration-75 origin-center shadow-2xl rounded-sm"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
        }}
      >
        {/* Main Processed Canvas */}
        <canvas
          ref={canvasRef}
          id="main-photo-canvas"
          className="max-h-[82vh] max-w-[82vw] object-contain block rounded-sm shadow-xl bg-transparent"
        />

        {/* Inpaint Drawing Layer */}
        {isInpaintMode && (
          <canvas
            ref={maskCanvasRef}
            id="inpaint-mask-canvas"
            className="absolute inset-0 w-full h-full cursor-none z-20 pointer-events-auto"
            onMouseDown={startDrawingMask}
            onMouseMove={drawMask}
            onMouseUp={stopDrawingMask}
            onMouseEnter={() => setIsHoveringCanvas(true)}
            onMouseLeave={() => {
              setIsHoveringCanvas(false);
              stopDrawingMask();
            }}
          />
        )}

        {/* Custom Brush Cursor when in Inpainting mode */}
        {isInpaintMode && isHoveringCanvas && (
          <div
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y}px`,
              width: `${brushSize * 2}px`,
              height: `${brushSize * 2}px`,
              backgroundColor: isEraser
                ? 'rgba(255, 255, 255, 0.3)'
                : 'rgba(239, 68, 68, 0.4)',
            }}
          />
        )}

        {/* Before / After Split View Overlay */}
        {compareMode && originalImage && (
          <div
            id="compare-overlay"
            className="absolute inset-0 overflow-hidden pointer-events-none z-10"
            style={{
              clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)`,
            }}
          >
            <img
              src={originalImage.src}
              alt="Original"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain block"
            />
          </div>
        )}

        {/* Draggable Split Handle when compareMode is active */}
        {compareMode && (
          <div
            id="split-handle"
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-25 shadow-lg group pointer-events-auto"
            style={{ left: `${splitPos}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
          >
            {/* Grab button */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-lg border border-neutral-300">
              <span className="text-[10px] font-bold">⟷</span>
            </div>
            {/* Labels */}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/75 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm pointer-events-none">
              Original
            </div>
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-indigo-600/90 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm pointer-events-none">
              Edited
            </div>
          </div>
        )}

        {/* Interactive Crop Boundary overlay */}
        {isCropMode && (
          <div
            id="crop-overlay-bounds"
            className="absolute inset-0 border-2 border-dashed border-indigo-400 pointer-events-auto bg-black/40 z-20"
          >
            {/* Rule of thirds grid lines */}
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />

            <div className="absolute -top-7 left-2 px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-semibold flex items-center gap-1 shadow">
              <Scissors className="w-3 h-3" />
              <span>Crop Active</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Processing Overlay Banner */}
      {isProcessing && (
        <div
          id="ai-processing-loader"
          className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in"
        >
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col items-center max-w-sm text-center shadow-2xl shadow-indigo-500/10">
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-neutral-900 border border-neutral-700">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              </div>
            </div>
            <h4 className="text-sm font-bold text-neutral-100 mb-1">
              Gemini AI Processing
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {processingMessage || 'Synthesizing changes with Gemini 3.1 Flash...'}
            </p>
          </div>
        </div>
      )}

      {/* Subtle Hint Bar at Bottom */}
      <div className="absolute bottom-3 left-4 text-[11px] text-neutral-500 flex items-center gap-3 pointer-events-none">
        <span>Alt + Drag to Pan</span>
        <span>•</span>
        <span>Mouse wheel to Zoom</span>
        {isInpaintMode && (
          <>
            <span>•</span>
            <span className="text-rose-400">Brush active: Paint area to replace</span>
          </>
        )}
      </div>
    </div>
  );
};
