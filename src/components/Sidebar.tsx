import React, { useState } from 'react';
import {
  Sliders,
  Wand2,
  Sparkles,
  Layers,
  Paintbrush,
  Crop,
  Type,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Eraser,
  Palette,
  Plus,
  ArrowRight,
  Eye,
  Check,
  Zap,
} from 'lucide-react';
import {
  ActiveTab,
  AIFilterPreset,
  AspectRatioOption,
  BackgroundMode,
  BackgroundState,
  FilterAdjustments,
  TextOverlay,
  TransformState,
} from '../types';
import { AI_FILTERS } from '../data/aiFilters';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  adjustments: FilterAdjustments;
  onAdjustmentChange: (key: keyof FilterAdjustments, val: number) => void;
  onResetAdjustments: () => void;
  // AI Filters
  onApplyAIFilter: (preset: AIFilterPreset) => void;
  onCustomAIPrompt: (prompt: string) => void;
  isProcessing: boolean;
  // Background
  bgState: BackgroundState;
  onBgStateChange: (newBg: BackgroundState) => void;
  onRemoveBackgroundAI: () => void;
  onGenerateAIBackground: (prompt: string) => void;
  // Inpaint
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  isEraser: boolean;
  onToggleEraser: () => void;
  onClearMask: () => void;
  onApplyInpaint: (prompt: string) => void;
  // Transform & Crop
  transform: TransformState;
  onTransformChange: (newTransform: TransformState) => void;
  aspectRatio: AspectRatioOption;
  onAspectRatioChange: (ratio: AspectRatioOption) => void;
  // AI Auto-Enhance
  onTriggerAutoEnhance: () => void;
  // Text & Overlays
  textOverlays: TextOverlay[];
  onAddText: (text: string) => void;
  onRemoveText: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  adjustments,
  onAdjustmentChange,
  onResetAdjustments,
  onApplyAIFilter,
  onCustomAIPrompt,
  isProcessing,
  bgState,
  onBgStateChange,
  onRemoveBackgroundAI,
  onGenerateAIBackground,
  brushSize,
  onBrushSizeChange,
  isEraser,
  onToggleEraser,
  onClearMask,
  onApplyInpaint,
  transform,
  onTransformChange,
  aspectRatio,
  onAspectRatioChange,
  onTriggerAutoEnhance,
  textOverlays,
  onAddText,
  onRemoveText,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [inpaintPrompt, setInpaintPrompt] = useState('');
  const [bgGenPrompt, setBgGenPrompt] = useState('');
  const [newTextVal, setNewTextVal] = useState('');

  const tabs = [
    { id: 'adjust' as ActiveTab, label: 'Adjust', icon: Sliders },
    { id: 'ai_filters' as ActiveTab, label: 'AI Filters', icon: Wand2 },
    { id: 'ai_tools' as ActiveTab, label: 'AI Studio', icon: Sparkles },
    { id: 'background' as ActiveTab, label: 'Backdrop', icon: Layers },
    { id: 'inpaint' as ActiveTab, label: 'Inpaint', icon: Paintbrush },
    { id: 'crop_transform' as ActiveTab, label: 'Crop', icon: Crop },
    { id: 'text_stickers' as ActiveTab, label: 'Text', icon: Type },
  ];

  return (
    <aside
      id="studio-sidebar"
      className="w-80 border-l border-neutral-800 bg-neutral-900 flex flex-col z-20 select-none h-full"
    >
      {/* Top Tab Switcher */}
      <div className="flex border-b border-neutral-800 bg-neutral-950/80 p-1.5 gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-[50px] flex flex-col items-center py-2 px-1 rounded-lg text-[11px] font-medium transition-all ${
                isActive
                  ? 'bg-neutral-800 text-indigo-300 shadow-sm border border-neutral-700/80'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-indigo-400' : ''}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-4 text-neutral-200">
        {/* TAB 1: ADJUSTMENTS */}
        {activeTab === 'adjust' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Light & Color Balance
              </h3>
              <button
                onClick={onResetAdjustments}
                className="text-[11px] text-neutral-400 hover:text-rose-400 transition-colors"
              >
                Reset Sliders
              </button>
            </div>

            {/* Light Controls */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase">
                Exposure & Tone
              </span>
              <SliderRow
                label="Exposure"
                value={adjustments.exposure}
                min={-100}
                max={100}
                onChange={(v) => onAdjustmentChange('exposure', v)}
              />
              <SliderRow
                label="Brightness"
                value={adjustments.brightness}
                min={-100}
                max={100}
                onChange={(v) => onAdjustmentChange('brightness', v)}
              />
              <SliderRow
                label="Contrast"
                value={adjustments.contrast}
                min={-100}
                max={100}
                onChange={(v) => onAdjustmentChange('contrast', v)}
              />
              <SliderRow
                label="Highlights"
                value={adjustments.highlights}
                min={-100}
                max={100}
                onChange={(v) => onAdjustmentChange('highlights', v)}
              />
              <SliderRow
                label="Shadows"
                value={adjustments.shadows}
                min={-100}
                max={100}
                onChange={(v) => onAdjustmentChange('shadows', v)}
              />
            </div>

            {/* Color Controls */}
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase">
                Color Grading
              </span>
              <SliderRow
                label="Saturation"
                value={adjustments.saturation}
                min={-100}
                max={100}
                onChange={(v) => onAdjustmentChange('saturation', v)}
              />
              <SliderRow
                label="Temperature"
                value={adjustments.temperature}
                min={-100}
                max={100}
                unit="K"
                onChange={(v) => onAdjustmentChange('temperature', v)}
              />
              <SliderRow
                label="Tint"
                value={adjustments.tint}
                min={-100}
                max={100}
                onChange={(v) => onAdjustmentChange('tint', v)}
              />
              <SliderRow
                label="Hue Shift"
                value={adjustments.hueRotate}
                min={-180}
                max={180}
                unit="°"
                onChange={(v) => onAdjustmentChange('hueRotate', v)}
              />
            </div>

            {/* Effects & Details */}
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-500 uppercase">
                Texture & Effects
              </span>
              <SliderRow
                label="Sharpness"
                value={adjustments.sharpness}
                min={0}
                max={100}
                onChange={(v) => onAdjustmentChange('sharpness', v)}
              />
              <SliderRow
                label="Vignette"
                value={adjustments.vignette}
                min={0}
                max={100}
                onChange={(v) => onAdjustmentChange('vignette', v)}
              />
              <SliderRow
                label="Film Grain"
                value={adjustments.grain}
                min={0}
                max={100}
                onChange={(v) => onAdjustmentChange('grain', v)}
              />
              <SliderRow
                label="Blur"
                value={adjustments.blur}
                min={0}
                max={30}
                unit="px"
                onChange={(v) => onAdjustmentChange('blur', v)}
              />
              <SliderRow
                label="Sepia"
                value={adjustments.sepia}
                min={0}
                max={100}
                onChange={(v) => onAdjustmentChange('sepia', v)}
              />
              <SliderRow
                label="Grayscale"
                value={adjustments.grayscale}
                min={0}
                max={100}
                onChange={(v) => onAdjustmentChange('grayscale', v)}
              />
            </div>
          </div>
        )}

        {/* TAB 2: AI FILTERS */}
        {activeTab === 'ai_filters' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                AI Aesthetic Presets
              </h3>
              <p className="text-xs text-neutral-500">
                Transform style, lighting, and textures using Gemini generative AI.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {AI_FILTERS.map((preset) => (
                <button
                  key={preset.id}
                  id={`filter-${preset.id}`}
                  disabled={isProcessing}
                  onClick={() => onApplyAIFilter(preset)}
                  className="group relative p-2.5 rounded-xl border border-neutral-800 hover:border-indigo-500/50 bg-neutral-950/60 hover:bg-neutral-800/80 text-left transition-all overflow-hidden flex flex-col justify-between h-28"
                >
                  <div
                    className={`w-full h-8 rounded-lg bg-gradient-to-r ${preset.previewColor} mb-2 shadow-inner opacity-85 group-hover:opacity-100 transition-opacity`}
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-200 group-hover:text-white truncate">
                      {preset.name}
                    </h4>
                    <p className="text-[10px] text-neutral-500 line-clamp-1">
                      {preset.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom AI Prompt Box */}
            <div className="pt-3 border-t border-neutral-800 space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400">
                Custom AI Filter Prompt
              </span>
              <div className="relative">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Turn into 90s vintage flash photography, cinematic warm halation, soft grainy bokeh..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-neutral-200 placeholder-neutral-600 resize-none"
                />
                <button
                  onClick={() => {
                    if (customPrompt.trim()) {
                      onCustomAIPrompt(customPrompt);
                    }
                  }}
                  disabled={!customPrompt.trim() || isProcessing}
                  className="mt-2 w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Apply AI Style</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI STUDIO & SMART TOOLS */}
        {activeTab === 'ai_tools' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Gemini AI Studio
              </h3>
              <p className="text-xs text-neutral-500">
                AI-assisted photo retouching, critique, and intelligent auto-enhancement.
              </p>
            </div>

            {/* AI Auto-Enhance Banner */}
            <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 to-neutral-950 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-100">
                    AI Auto-Enhance & Colorist
                  </h4>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    Deep histogram analysis with Gemini 3.8 Flash to suggest balanced exposure, dynamic range, and warmth.
                  </p>
                </div>
              </div>
              <button
                id="btn-auto-enhance"
                onClick={onTriggerAutoEnhance}
                disabled={isProcessing}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Analyze & Auto-Enhance</span>
              </button>
            </div>

            {/* Generative Object Modification / Prompt Editor */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-neutral-300">
                Generative Image Editing
              </h4>
              <p className="text-xs text-neutral-500">
                Direct Gemini 3.1 Flash to add, remove, or modify elements anywhere in the scene.
              </p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Add a friendly golden retriever dog sitting beside the person; change the sky to a sunset with pink clouds..."
                rows={4}
                className="w-full text-xs p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-neutral-200 placeholder-neutral-600 resize-none"
              />
              <button
                onClick={() => {
                  if (customPrompt.trim()) {
                    onCustomAIPrompt(customPrompt);
                  }
                }}
                disabled={!customPrompt.trim() || isProcessing}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Edit</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: BACKGROUND & ISOLATION */}
        {activeTab === 'background' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Subject & Background
              </h3>
              <p className="text-xs text-neutral-500">
                Isolate subjects with AI and place them in transparent, solid, gradient, or AI generated environments.
              </p>
            </div>

            {/* 1-Click AI Background Removal */}
            <button
              id="btn-remove-bg-ai"
              onClick={onRemoveBackgroundAI}
              disabled={isProcessing}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-98 transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>1-Click AI Background Removal</span>
            </button>

            {/* Backdrop Modes */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-neutral-400">
                Backdrop Mode
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'original' as BackgroundMode, label: 'Original' },
                  { mode: 'transparent' as BackgroundMode, label: 'Transparent' },
                  { mode: 'solid' as BackgroundMode, label: 'Solid Color' },
                  { mode: 'gradient' as BackgroundMode, label: 'Studio Light' },
                  { mode: 'blur' as BackgroundMode, label: 'Bokeh Blur' },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() =>
                      onBgStateChange({ ...bgState, mode: item.mode })
                    }
                    className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      bgState.mode === item.mode
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Solid Studio Color Palette */}
            {bgState.mode === 'solid' && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-[11px] font-semibold text-neutral-400">
                  Studio Colors
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    '#FFFFFF',
                    '#F8FAFC',
                    '#E2E8F0',
                    '#64748B',
                    '#0F172A',
                    '#000000',
                    '#EF4444',
                    '#F59E0B',
                    '#10B981',
                    '#3B82F6',
                    '#8B5CF6',
                    '#EC4899',
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        onBgStateChange({
                          ...bgState,
                          solidColor: color,
                        })
                      }
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        bgState.solidColor === color
                          ? 'scale-110 border-white shadow-md'
                          : 'border-neutral-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Gradient Studio Presets */}
            {bgState.mode === 'gradient' && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-[11px] font-semibold text-neutral-400">
                  Gradient Studio Backdrops
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'studio-softbox', name: 'Studio Softbox' },
                    { id: 'sunset', name: 'Golden Sunset' },
                    { id: 'cyberpunk', name: 'Cyber Neon' },
                    { id: 'dark-luxury', name: 'Dark Luxury' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() =>
                        onBgStateChange({ ...bgState, gradient: g.id })
                      }
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        bgState.gradient === g.id
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Portrait Bokeh Blur Slider */}
            {bgState.mode === 'blur' && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <SliderRow
                  label="Aperture Bokeh Blur"
                  value={bgState.blurStrength}
                  min={5}
                  max={40}
                  unit="px"
                  onChange={(val) =>
                    onBgStateChange({ ...bgState, blurStrength: val })
                  }
                />
              </div>
            )}

            {/* Generate Custom AI Background */}
            <div className="pt-3 border-t border-neutral-800 space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400">
                Generate Custom AI Backdrop
              </span>
              <input
                type="text"
                value={bgGenPrompt}
                onChange={(e) => setBgGenPrompt(e.target.value)}
                placeholder="e.g., Modern minimalist concrete loft with plants..."
                className="w-full text-xs p-2 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-neutral-200 placeholder-neutral-600"
              />
              <button
                onClick={() => {
                  if (bgGenPrompt.trim()) {
                    onGenerateAIBackground(bgGenPrompt);
                  }
                }}
                disabled={!bgGenPrompt.trim() || isProcessing}
                className="w-full py-2 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700/60 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Generate & Apply Backdrop</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: INPAINT & GENERATIVE BRUSH */}
        {activeTab === 'inpaint' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Generative Inpaint & Erase
              </h3>
              <p className="text-xs text-neutral-500">
                Brush over any object or area on the canvas, then prompt AI to replace or remove it.
              </p>
            </div>

            {/* Brush Controls */}
            <div className="space-y-3 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
              <SliderRow
                label="Brush Size"
                value={brushSize}
                min={10}
                max={120}
                unit="px"
                onChange={onBrushSizeChange}
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onToggleEraser}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                    isEraser
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Eraser Mode</span>
                </button>
                <button
                  onClick={onClearMask}
                  className="py-1.5 px-3 rounded-lg text-xs font-medium text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/40 transition-colors"
                >
                  Clear Mask
                </button>
              </div>
            </div>

            {/* Inpaint Prompt */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400">
                What would you like to generate in the masked area?
              </span>
              <textarea
                value={inpaintPrompt}
                onChange={(e) => setInpaintPrompt(e.target.value)}
                placeholder="e.g., Remove person smoothly and fill in natural background; add stylish sunglasses; change jacket to leather jacket..."
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-neutral-200 placeholder-neutral-600 resize-none"
              />
              <button
                onClick={() => {
                  if (inpaintPrompt.trim()) {
                    onApplyInpaint(inpaintPrompt);
                  }
                }}
                disabled={!inpaintPrompt.trim() || isProcessing}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generative Fill Mask</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: CROP & TRANSFORM */}
        {activeTab === 'crop_transform' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Crop & Orientation
              </h3>
              <p className="text-xs text-neutral-500">
                Straighten, rotate, flip, and crop with standard aspect ratios.
              </p>
            </div>

            {/* Aspect Ratio Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400">
                Aspect Ratio
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['free', '1:1', '4:5', '16:9', '9:16', '4:3', '3:2', '2:3'] as AspectRatioOption[]).map(
                  (ratio) => (
                    <button
                      key={ratio}
                      onClick={() => onAspectRatioChange(ratio)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        aspectRatio === ratio
                          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {ratio === 'free' ? 'Custom' : ratio}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Rotate & Flip Actions */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <span className="text-[11px] font-semibold text-neutral-400">
                Transform Actions
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onTransformChange({
                      ...transform,
                      rotation: (transform.rotation - 90) % 360,
                    })
                  }
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Rotate -90°</span>
                </button>
                <button
                  onClick={() =>
                    onTransformChange({
                      ...transform,
                      rotation: (transform.rotation + 90) % 360,
                    })
                  }
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate +90°</span>
                </button>
                <button
                  onClick={() =>
                    onTransformChange({
                      ...transform,
                      flipH: !transform.flipH,
                    })
                  }
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    transform.flipH
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  onClick={() =>
                    onTransformChange({
                      ...transform,
                      flipV: !transform.flipV,
                    })
                  }
                  className={`p-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    transform.flipV
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            </div>

            {/* Straighten Angle slider */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <SliderRow
                label="Angle Straighten"
                value={transform.rotation}
                min={-45}
                max={45}
                unit="°"
                onChange={(val) =>
                  onTransformChange({ ...transform, rotation: val })
                }
              />
            </div>
          </div>
        )}

        {/* TAB 7: TEXT & STICKERS */}
        {activeTab === 'text_stickers' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Typography & Watermarks
              </h3>
              <p className="text-xs text-neutral-500">
                Add text captions, copyright watermarks, and badges directly on your photo.
              </p>
            </div>

            {/* Add text input */}
            <div className="space-y-2">
              <input
                type="text"
                value={newTextVal}
                onChange={(e) => setNewTextVal(e.target.value)}
                placeholder="Enter caption or watermark text..."
                className="w-full text-xs p-2 rounded-lg bg-neutral-950 border border-neutral-800 focus:border-indigo-500 focus:outline-none text-neutral-200 placeholder-neutral-600"
              />
              <button
                onClick={() => {
                  if (newTextVal.trim()) {
                    onAddText(newTextVal);
                    setNewTextVal('');
                  }
                }}
                disabled={!newTextVal.trim()}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Text to Canvas</span>
              </button>
            </div>

            {/* Overlays List */}
            {textOverlays.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-[11px] font-semibold text-neutral-400">
                  Active Text Overlays ({textOverlays.length})
                </span>
                <div className="space-y-1.5">
                  {textOverlays.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium truncate max-w-[180px]">
                        "{item.text}"
                      </span>
                      <button
                        onClick={() => onRemoveText(item.id)}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

// Reusable Slider Component with clean styling, double-click reset, and numeric value
interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (val: number) => void;
}

const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  unit = '',
  onChange,
}) => {
  return (
    <div className="space-y-1 group">
      <div className="flex items-center justify-between text-[11px]">
        <span
          className="text-neutral-300 group-hover:text-white cursor-pointer select-none"
          onDoubleClick={() => onChange(0)}
          title="Double click to reset to 0"
        >
          {label}
        </span>
        <span className="font-mono text-neutral-400 text-[10px]">
          {value > 0 ? `+${value}` : value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
      />
    </div>
  );
};
