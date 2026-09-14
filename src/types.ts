export interface FilterAdjustments {
  brightness: number; // -100 to 100 (0 default)
  contrast: number; // -100 to 100 (0 default)
  exposure: number; // -100 to 100 (0 default)
  highlights: number; // -100 to 100 (0 default)
  shadows: number; // -100 to 100 (0 default)
  saturation: number; // -100 to 100 (0 default)
  vibrance: number; // -100 to 100 (0 default)
  temperature: number; // -100 to 100 (0 default, warm/cool)
  tint: number; // -100 to 100 (0 default, green/magenta)
  sharpness: number; // 0 to 100 (0 default)
  blur: number; // 0 to 50 (0 default)
  vignette: number; // 0 to 100 (0 default)
  grain: number; // 0 to 100 (0 default)
  sepia: number; // 0 to 100 (0 default)
  grayscale: number; // 0 to 100 (0 default)
  hueRotate: number; // -180 to 180 (0 default)
  invert: number; // 0 to 100 (0 default)
}

export const DEFAULT_ADJUSTMENTS: FilterAdjustments = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
  grain: 0,
  sepia: 0,
  grayscale: 0,
  hueRotate: 0,
  invert: 0,
};

export interface TransformState {
  rotation: number; // in degrees (0, 90, 180, 270 or arbitrary)
  flipH: boolean;
  flipV: boolean;
  crop: CropRect | null;
}

export interface CropRect {
  x: number; // 0-1 percentage
  y: number; // 0-1 percentage
  width: number; // 0-1 percentage
  height: number; // 0-1 percentage
}

export type AspectRatioOption = 'free' | '1:1' | '4:5' | '16:9' | '9:16' | '4:3' | '3:2' | '2:3';

export type BackgroundMode = 'original' | 'transparent' | 'solid' | 'gradient' | 'blur' | 'custom_image';

export interface BackgroundState {
  mode: BackgroundMode;
  solidColor: string;
  gradient: string;
  blurStrength: number; // in px
  customImageUrl?: string;
  maskCanvasDataUrl?: string; // transparent cutout
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color: string;
  fontSize: number; // in px
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '900';
  shadow: boolean;
  backgroundColor?: string;
  rotation: number;
}

export interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  label: string;
  imageDataUrl: string;
  adjustments: FilterAdjustments;
  transform: TransformState;
  bgState: BackgroundState;
}

export interface AIFilterPreset {
  id: string;
  name: string;
  category: 'cinematic' | 'artistic' | 'vintage' | 'creative';
  description: string;
  prompt: string;
  previewColor: string;
  localAdjustments?: Partial<FilterAdjustments>;
}

export interface SampleImage {
  id: string;
  title: string;
  category: string;
  url: string;
  thumbnail: string;
}

export type ActiveTab = 
  | 'adjust' 
  | 'ai_filters' 
  | 'ai_tools' 
  | 'background' 
  | 'crop_transform' 
  | 'inpaint'
  | 'text_stickers';
