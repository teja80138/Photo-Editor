import React from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { SAMPLE_IMAGES } from '../data/sampleImages';
import { SampleImage } from '../types';

interface SamplePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleImage) => void;
}

export const SamplePickerModal: React.FC<SamplePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="sample-picker-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="sample-picker-modal"
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-in"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">
                Sample Photos Library
              </h3>
              <p className="text-xs text-neutral-400">
                Pick a high-resolution photo to test AI filters, background removal, and colorist tools
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

        {/* Grid of sample photos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => {
                onSelectSample(sample);
                onClose();
              }}
              className="group relative aspect-4/3 rounded-xl overflow-hidden border border-neutral-800 hover:border-indigo-500 text-left transition-all hover:scale-[1.02] shadow-sm"
            >
              <img
                src={sample.thumbnail}
                alt={sample.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                <span className="text-[10px] uppercase font-semibold text-indigo-300 tracking-wider">
                  {sample.category}
                </span>
                <h4 className="text-xs font-bold text-white truncate">
                  {sample.title}
                </h4>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
