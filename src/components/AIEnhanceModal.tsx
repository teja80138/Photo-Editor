import React from 'react';
import { X, Sparkles, Check, SunMedium, Camera, Lightbulb } from 'lucide-react';
import { FilterAdjustments } from '../types';

export interface AIAnalysisResult {
  brightness: number;
  contrast: number;
  exposure: number;
  highlights: number;
  shadows: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  sharpness: number;
  vignette: number;
  critique: string;
  lightingCondition: string;
  primarySubjects: string[];
  keyRecommendations: string[];
}

interface AIEnhanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AIAnalysisResult | null;
  onApplyAdjustments: (adjustments: Partial<FilterAdjustments>) => void;
}

export const AIEnhanceModal: React.FC<AIEnhanceModalProps> = ({
  isOpen,
  onClose,
  analysis,
  onApplyAdjustments,
}) => {
  if (!isOpen || !analysis) return null;

  const handleApply = () => {
    onApplyAdjustments({
      brightness: analysis.brightness || 0,
      contrast: analysis.contrast || 0,
      exposure: analysis.exposure || 0,
      highlights: analysis.highlights || 0,
      shadows: analysis.shadows || 0,
      saturation: analysis.saturation || 0,
      vibrance: analysis.vibrance || 0,
      temperature: analysis.temperature || 0,
      tint: analysis.tint || 0,
      sharpness: analysis.sharpness || 0,
      vignette: analysis.vignette || 0,
    });
    onClose();
  };

  return (
    <div
      id="ai-enhance-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="ai-enhance-modal"
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Gemini 3.8 Colorist Analysis
              </h3>
              <p className="text-xs text-neutral-400">
                Professional photographic evaluation & auto-tune
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

        {/* Lighting & Subject Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {analysis.lightingCondition && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <SunMedium className="w-3.5 h-3.5" />
              <span>{analysis.lightingCondition}</span>
            </div>
          )}
          {analysis.primarySubjects?.map((sub, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-medium"
            >
              <Camera className="w-3 h-3 text-indigo-400" />
              <span>{sub}</span>
            </div>
          ))}
        </div>

        {/* Critique Box */}
        <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 leading-relaxed space-y-1">
          <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px] block">
            Expert Critique
          </span>
          <p>{analysis.critique}</p>
        </div>

        {/* Recommendations */}
        {analysis.keyRecommendations?.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
              Recommendations
            </span>
            <ul className="space-y-1 text-xs text-neutral-300">
              {analysis.keyRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sliders Preview */}
        <div className="pt-2 border-t border-neutral-800 space-y-2">
          <span className="text-[11px] font-semibold text-neutral-400">
            Suggested Adjustments:
          </span>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            {[
              { label: 'Exposure', val: analysis.exposure },
              { label: 'Contrast', val: analysis.contrast },
              { label: 'Highlights', val: analysis.highlights },
              { label: 'Shadows', val: analysis.shadows },
              { label: 'Saturation', val: analysis.saturation },
              { label: 'Warmth', val: analysis.temperature },
            ].map((item, i) => (
              <div
                key={i}
                className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 flex justify-between items-center"
              >
                <span className="text-neutral-400">{item.label}</span>
                <span
                  className={
                    item.val > 0
                      ? 'text-emerald-400'
                      : item.val < 0
                      ? 'text-amber-400'
                      : 'text-neutral-400'
                  }
                >
                  {item.val > 0 ? `+${item.val}` : item.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Apply AI Grading</span>
          </button>
        </div>
      </div>
    </div>
  );
};
