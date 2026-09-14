/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CanvasArea } from './components/CanvasArea';
import { Sidebar } from './components/Sidebar';
import { ExportModal } from './components/ExportModal';
import { SamplePickerModal } from './components/SamplePickerModal';
import { AIEnhanceModal, AIAnalysisResult } from './components/AIEnhanceModal';
import {
  ActiveTab,
  AIFilterPreset,
  AspectRatioOption,
  BackgroundState,
  DEFAULT_ADJUSTMENTS,
  FilterAdjustments,
  HistoryItem,
  SampleImage,
  TextOverlay,
  TransformState,
} from './types';
import { SAMPLE_IMAGES } from './data/sampleImages';
import {
  loadImage,
  processBackgroundCutout,
  renderCompositeCanvas,
} from './utils/canvasEngine';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export default function App() {
  // Canvas references
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core image elements
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [cutoutImage, setCutoutImage] = useState<HTMLImageElement | null>(null);
  const [customBgImage, setCustomBgImage] = useState<HTMLImageElement | null>(null);

  // Editing state
  const [adjustments, setAdjustments] = useState<FilterAdjustments>(DEFAULT_ADJUSTMENTS);
  const [transform, setTransform] = useState<TransformState>({
    rotation: 0,
    flipH: false,
    flipV: false,
    crop: null,
  });
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('free');
  const [bgState, setBgState] = useState<BackgroundState>({
    mode: 'original',
    solidColor: '#FFFFFF',
    gradient: 'studio-softbox',
    blurStrength: 20,
  });
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);

  // Studio UI states
  const [activeTab, setActiveTab] = useState<ActiveTab>('adjust');
  const [compareMode, setCompareMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [brushSize, setBrushSize] = useState(35);
  const [isEraser, setIsEraser] = useState(false);

  // AI & Async State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isAIEnhanceModalOpen, setIsAIEnhanceModalOpen] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState<AIAnalysisResult | null>(null);

  // History Stack
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // 1. Initial Load with default sample image
  useEffect(() => {
    const initDefaultImage = async () => {
      try {
        const defaultSample = SAMPLE_IMAGES[0];
        const img = await loadImage(defaultSample.url);
        setBaseImage(img);
        setOriginalImage(img);

        // Push initial history state
        const initialItem: HistoryItem = {
          id: 'init-' + Date.now(),
          timestamp: Date.now(),
          label: 'Original Photo',
          imageDataUrl: defaultSample.url,
          adjustments: { ...DEFAULT_ADJUSTMENTS },
          transform: { rotation: 0, flipH: false, flipV: false, crop: null },
          bgState: {
            mode: 'original',
            solidColor: '#FFFFFF',
            gradient: 'studio-softbox',
            blurStrength: 20,
          },
        };
        setHistory([initialItem]);
        setHistoryIndex(0);
      } catch (err) {
        console.error('Failed to load initial image:', err);
      }
    };
    initDefaultImage();
  }, []);

  // 2. Render Canvas whenever relevant parameters update
  const triggerRender = useCallback(async () => {
    if (!mainCanvasRef.current || !baseImage) return;
    await renderCompositeCanvas({
      targetCanvas: mainCanvasRef.current,
      baseImage,
      adjustments,
      transform,
      backgroundState: bgState,
      textOverlays,
      cutoutImage,
      customBgImage,
    });
  }, [
    baseImage,
    adjustments,
    transform,
    bgState,
    textOverlays,
    cutoutImage,
    customBgImage,
  ]);

  useEffect(() => {
    triggerRender();
  }, [triggerRender]);

  // Push new state to history
  const pushHistory = (label: string, customDataUrl?: string) => {
    const canvas = mainCanvasRef.current;
    const dataUrl = customDataUrl || (canvas ? canvas.toDataURL('image/png') : '');
    const newItem: HistoryItem = {
      id: 'hist-' + Date.now(),
      timestamp: Date.now(),
      label,
      imageDataUrl: dataUrl,
      adjustments: { ...adjustments },
      transform: { ...transform },
      bgState: { ...bgState },
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newItem);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo / Redo Handlers
  const handleUndo = async () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setAdjustments({ ...prev.adjustments });
      setTransform({ ...prev.transform });
      setBgState({ ...prev.bgState });
      if (prev.imageDataUrl) {
        try {
          const img = await loadImage(prev.imageDataUrl);
          setBaseImage(img);
        } catch (e) {
          console.warn('Undo image load fallback:', e);
        }
      }
      setHistoryIndex(historyIndex - 1);
      showToast(`Undo: ${prev.label}`);
    }
  };

  const handleRedo = async () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setAdjustments({ ...next.adjustments });
      setTransform({ ...next.transform });
      setBgState({ ...next.bgState });
      if (next.imageDataUrl) {
        try {
          const img = await loadImage(next.imageDataUrl);
          setBaseImage(img);
        } catch (e) {
          console.warn('Redo image load fallback:', e);
        }
      }
      setHistoryIndex(historyIndex + 1);
      showToast(`Redo: ${next.label}`);
    }
  };

  // Reset Adjustments
  const handleResetAdjustments = () => {
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
    pushHistory('Reset Adjustments');
    showToast('Adjustments reset to default');
  };

  // Load new Image (File Upload or Sample)
  const handleLoadNewImage = async (imgUrl: string, label: string = 'Loaded Image') => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Importing high-resolution photo...');
      const img = await loadImage(imgUrl);
      setBaseImage(img);
      setOriginalImage(img);
      setCutoutImage(null);
      setCustomBgImage(null);
      setAdjustments({ ...DEFAULT_ADJUSTMENTS });
      setTransform({ rotation: 0, flipH: false, flipV: false, crop: null });
      setBgState({
        mode: 'original',
        solidColor: '#FFFFFF',
        gradient: 'studio-softbox',
        blurStrength: 20,
      });
      setTextOverlays([]);

      const newItem: HistoryItem = {
        id: 'hist-' + Date.now(),
        timestamp: Date.now(),
        label,
        imageDataUrl: imgUrl,
        adjustments: { ...DEFAULT_ADJUSTMENTS },
        transform: { rotation: 0, flipH: false, flipV: false, crop: null },
        bgState: {
          mode: 'original',
          solidColor: '#FFFFFF',
          gradient: 'studio-softbox',
          blurStrength: 20,
        },
      };
      setHistory([newItem]);
      setHistoryIndex(0);
      showToast(`${label} ready in studio`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to load image: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        handleLoadNewImage(e.target.result as string, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Feature 1: Apply Curated AI Filter Preset
  const handleApplyAIFilter = async (preset: AIFilterPreset) => {
    if (!mainCanvasRef.current) return;
    try {
      setIsProcessing(true);
      setProcessingMessage(`Applying "${preset.name}" with Gemini 3.1 Flash...`);

      const currentSnapshot = mainCanvasRef.current.toDataURL('image/png');

      const response = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentSnapshot,
          prompt: preset.prompt,
          model: 'gemini-3.1-flash-image-preview',
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'AI filter generation failed.');
      }

      const updatedImg = await loadImage(data.image);
      setBaseImage(updatedImg);

      // Apply subtle local adjustments if defined
      if (preset.localAdjustments) {
        setAdjustments((prev) => ({
          ...prev,
          ...preset.localAdjustments,
        }));
      }

      pushHistory(`AI Filter: ${preset.name}`, data.image);
      showToast(`Filter applied: ${preset.name}`, 'success');
    } catch (err: any) {
      console.warn('AI Filter server fallback:', err.message);
      // Fallback: If AI is unreachable or rate limited, gracefully apply high-fidelity local grading adjustments
      if (preset.localAdjustments) {
        setAdjustments((prev) => ({
          ...prev,
          ...preset.localAdjustments,
        }));
        pushHistory(`Preset: ${preset.name}`);
        showToast(`Applied ${preset.name} visual grade`, 'info');
      } else {
        showToast(err.message || 'AI request failed', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Feature 2: Custom Text Prompt AI Edit
  const handleCustomAIPrompt = async (prompt: string) => {
    if (!mainCanvasRef.current || !prompt.trim()) return;
    try {
      setIsProcessing(true);
      setProcessingMessage(`Gemini 3.1 Flash generating: "${prompt}"...`);

      const currentSnapshot = mainCanvasRef.current.toDataURL('image/png');

      const response = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentSnapshot,
          prompt,
          model: 'gemini-3.1-flash-image-preview',
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Generative edit failed.');
      }

      const updatedImg = await loadImage(data.image);
      setBaseImage(updatedImg);
      pushHistory(`AI Edit: "${prompt.slice(0, 20)}..."`, data.image);
      showToast('Generative edit applied successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Generative edit encountered an error', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Feature 3: 1-Click AI Background Removal
  const handleRemoveBackgroundAI = async () => {
    if (!mainCanvasRef.current) return;
    try {
      setIsProcessing(true);
      setProcessingMessage('AI segmenting subject and removing background...');

      const currentSnapshot = mainCanvasRef.current.toDataURL('image/png');

      const response = await fetch('/api/ai/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentSnapshot,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to remove background.');
      }

      // Convert chroma background to true transparent PNG with edge feathering
      const rawAiImg = await loadImage(data.image);
      const transparentCutoutDataUrl = processBackgroundCutout(rawAiImg, 'auto', 45, 2);
      const cutoutImg = await loadImage(transparentCutoutDataUrl);

      setCutoutImage(cutoutImg);
      setBgState((prev) => ({ ...prev, mode: 'transparent' }));
      pushHistory('Background Removed (AI)');
      showToast('Background removed cleanly!', 'success');
    } catch (err: any) {
      console.warn('AI Background removal API failed, attempting instant local cutout:', err);
      // Instant Client-side local cutout fallback
      try {
        if (baseImage) {
          const localCutoutUrl = processBackgroundCutout(baseImage, 'auto', 35, 2);
          const cutoutImg = await loadImage(localCutoutUrl);
          setCutoutImage(cutoutImg);
          setBgState((prev) => ({ ...prev, mode: 'transparent' }));
          pushHistory('Background Cutout (Local)');
          showToast('Foreground subject isolated!', 'success');
        }
      } catch (localErr) {
        showToast('Background removal failed: ' + (err.message || 'Error'), 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Feature 4: Generate Custom Studio Backdrop
  const handleGenerateAIBackground = async (prompt: string) => {
    try {
      setIsProcessing(true);
      setProcessingMessage(`Generating custom backdrop: "${prompt}"...`);

      const response = await fetch('/api/ai/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio: '16:9',
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate backdrop.');
      }

      const bgImg = await loadImage(data.image);
      setCustomBgImage(bgImg);
      setBgState((prev) => ({ ...prev, mode: 'custom_image' }));
      pushHistory(`AI Backdrop: "${prompt.slice(0, 20)}..."`);
      showToast('AI backdrop generated and applied!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to generate backdrop', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Feature 5: Inpaint / Generative Retouching Mask
  const handleApplyInpaint = async (prompt: string) => {
    const mainCanvas = mainCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!mainCanvas || !maskCanvas || !prompt.trim()) return;

    try {
      setIsProcessing(true);
      setProcessingMessage(`Generative inpainting with Gemini 3.1 Flash...`);

      const currentSnapshot = mainCanvas.toDataURL('image/png');
      const maskSnapshot = maskCanvas.toDataURL('image/png');

      const response = await fetch('/api/ai/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: currentSnapshot,
          maskImage: maskSnapshot,
          prompt,
          model: 'gemini-3.1-flash-image-preview',
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Inpainting failed.');
      }

      const updatedImg = await loadImage(data.image);
      setBaseImage(updatedImg);

      // Clear mask canvas
      const ctx = maskCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

      pushHistory(`Inpaint: "${prompt.slice(0, 20)}..."`, data.image);
      showToast('Inpaint edit applied successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Inpaint failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Feature 6: Auto-Enhance & Colorist Analysis (Gemini 3.8 Flash)
  const handleTriggerAutoEnhance = async () => {
    if (!mainCanvasRef.current) return;
    try {
      setIsProcessing(true);
      setProcessingMessage('Gemini 3.8 Flash analyzing histogram and lighting balance...');

      const currentSnapshot = mainCanvasRef.current.toDataURL('image/jpeg', 0.85);

      const response = await fetch('/api/ai/analyze-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: currentSnapshot }),
      });

      const data = await response.json();
      if (!data.success || !data.analysis) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAiAnalysisData(data.analysis);
      setIsAIEnhanceModalOpen(true);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Analysis error', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyAnalysisAdjustments = (newAdj: Partial<FilterAdjustments>) => {
    setAdjustments((prev) => ({
      ...prev,
      ...newAdj,
    }));
    pushHistory('AI Auto-Enhanced');
    showToast('Auto-enhance color grading applied!', 'success');
  };

  // Clear mask canvas
  const handleClearMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      const ctx = maskCanvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      showToast('Inpainting mask cleared');
    }
  };

  // Add & Remove Text Overlays
  const handleAddText = (text: string) => {
    const newOverlay: TextOverlay = {
      id: 'txt-' + Date.now(),
      text,
      x: 50,
      y: 50,
      color: '#FFFFFF',
      fontSize: 36,
      fontFamily: 'Plus Jakarta Sans',
      fontWeight: 'bold',
      shadow: true,
      backgroundColor: 'rgba(0,0,0,0.4)',
      rotation: 0,
    };
    setTextOverlays((prev) => [...prev, newOverlay]);
    pushHistory(`Added text: "${text}"`);
    showToast('Text overlay added to canvas', 'success');
  };

  const handleRemoveText = (id: string) => {
    setTextOverlays((prev) => prev.filter((t) => t.id !== id));
  };

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, 'c' for split compare)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'c' || e.key === 'C') {
        setCompareMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Drag & drop file upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      id="photo-studio-app"
      className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Top Header */}
      <Header
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleResetAdjustments}
        onOpenSamplePicker={() => setIsSampleModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onImageUpload={handleFileUpload}
        compareMode={compareMode}
        onToggleCompare={() => setCompareMode(!compareMode)}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3, z + 0.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.2, z - 0.15))}
        onZoomReset={() => setZoom(1)}
        activeHistoryLabel={history[historyIndex]?.label}
        isProcessing={isProcessing}
      />

      {/* Main Studio Body: Canvas Viewport + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas Center Stage */}
        <CanvasArea
          canvasRef={mainCanvasRef}
          originalImage={originalImage}
          compareMode={compareMode}
          zoom={zoom}
          isProcessing={isProcessing}
          processingMessage={processingMessage}
          isInpaintMode={activeTab === 'inpaint'}
          brushSize={brushSize}
          brushColor="#EF4444"
          isEraser={isEraser}
          maskCanvasRef={maskCanvasRef}
          onMaskChange={() => {}}
          isCropMode={activeTab === 'crop_transform'}
          cropRect={transform.crop}
          onCropRectChange={(newCrop) => setTransform({ ...transform, crop: newCrop })}
          aspectRatio={aspectRatio}
        />

        {/* Studio Sidebar Controls */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          adjustments={adjustments}
          onAdjustmentChange={(key, val) =>
            setAdjustments((prev) => ({ ...prev, [key]: val }))
          }
          onResetAdjustments={handleResetAdjustments}
          onApplyAIFilter={handleApplyAIFilter}
          onCustomAIPrompt={handleCustomAIPrompt}
          isProcessing={isProcessing}
          bgState={bgState}
          onBgStateChange={setBgState}
          onRemoveBackgroundAI={handleRemoveBackgroundAI}
          onGenerateAIBackground={handleGenerateAIBackground}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          isEraser={isEraser}
          onToggleEraser={() => setIsEraser(!isEraser)}
          onClearMask={handleClearMask}
          onApplyInpaint={handleApplyInpaint}
          transform={transform}
          onTransformChange={setTransform}
          aspectRatio={aspectRatio}
          onAspectRatioChange={setAspectRatio}
          onTriggerAutoEnhance={handleTriggerAutoEnhance}
          textOverlays={textOverlays}
          onAddText={handleAddText}
          onRemoveText={handleRemoveText}
        />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          id="studio-toast"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-xl backdrop-blur-md animate-slide-up text-xs font-medium border-neutral-700 bg-neutral-900/95 text-neutral-100"
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          {toast.type === 'info' && (
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        canvasRef={mainCanvasRef}
      />

      <SamplePickerModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={(sample) => handleLoadNewImage(sample.url, sample.title)}
      />

      <AIEnhanceModal
        isOpen={isAIEnhanceModalOpen}
        onClose={() => setIsAIEnhanceModalOpen(false)}
        analysis={aiAnalysisData}
        onApplyAdjustments={handleApplyAnalysisAdjustments}
      />
    </div>
  );
}
