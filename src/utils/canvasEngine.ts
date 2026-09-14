import {
  BackgroundState,
  CropRect,
  FilterAdjustments,
  StickerOverlay,
  TextOverlay,
  TransformState,
} from '../types';

/**
 * Loads an image from a URL or base64 string safely with crossOrigin
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Applies color temperature & tint to an imageData buffer
 * temperature: -100 to 100 (negative is cooler/blue, positive is warmer/amber)
 * tint: -100 to 100 (negative is green, positive is magenta)
 */
function applyColorGrade(
  imageData: ImageData,
  adjustments: FilterAdjustments
) {
  const { temperature, tint, highlights, shadows, exposure, grain } = adjustments;
  if (
    temperature === 0 &&
    tint === 0 &&
    highlights === 0 &&
    shadows === 0 &&
    exposure === 0 &&
    grain === 0
  ) {
    return;
  }

  const data = imageData.data;
  const len = data.length;

  // Pre-calculate multipliers
  const tempR = temperature > 0 ? 1 + (temperature / 100) * 0.25 : 1;
  const tempB = temperature < 0 ? 1 + (Math.abs(temperature) / 100) * 0.25 : 1;
  const tintG = tint < 0 ? 1 + (Math.abs(tint) / 100) * 0.2 : 1;
  const tintR = tint > 0 ? 1 + (tint / 100) * 0.15 : 1;
  const tintB = tint > 0 ? 1 + (tint / 100) * 0.15 : 1;

  const expMult = Math.pow(2, exposure / 60);

  const shadowAdj = shadows / 100;
  const highlightAdj = highlights / 100;
  const grainAmount = grain / 100;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Exposure
    if (exposure !== 0) {
      r *= expMult;
      g *= expMult;
      b *= expMult;
    }

    // Luminance estimate for shadow/highlight adjustment
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const normLum = lum / 255;

    // Shadows (affects darker pixels)
    if (shadows !== 0 && normLum < 0.6) {
      const weight = (0.6 - normLum) / 0.6;
      const boost = 1 + shadowAdj * weight * 0.5;
      r *= boost;
      g *= boost;
      b *= boost;
    }

    // Highlights (affects brighter pixels)
    if (highlights !== 0 && normLum > 0.4) {
      const weight = (normLum - 0.4) / 0.6;
      const boost = 1 + highlightAdj * weight * 0.5;
      r *= boost;
      g *= boost;
      b *= boost;
    }

    // Temperature & Tint
    r *= tempR * tintR;
    g *= tintG;
    b *= tempB * tintB;

    // Film Grain
    if (grainAmount > 0) {
      const noise = (Math.random() - 0.5) * grainAmount * 60;
      r += noise;
      g += noise;
      b += noise;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }
}

/**
 * 3x3 Convolution Sharpness filter
 */
function applySharpening(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number
) {
  if (strength <= 0) return;
  const imgData = ctx.getImageData(0, 0, width, height);
  const src = imgData.data;
  const output = ctx.createImageData(width, height);
  const dst = output.data;

  // kernel weight
  const amount = (strength / 100) * 1.5;
  const center = 1 + 4 * amount;
  const edge = -amount;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top = ((y - 1) * width + x) * 4 + c;
        const bottom = ((y + 1) * width + x) * 4 + c;
        const left = (y * width + (x - 1)) * 4 + c;
        const right = (y * width + (x + 1)) * 4 + c;
        const cur = idx + c;

        const val =
          src[cur] * center +
          (src[top] + src[bottom] + src[left] + src[right]) * edge;

        dst[cur] = Math.max(0, Math.min(255, val));
      }
      dst[idx + 3] = src[idx + 3];
    }
  }

  ctx.putImageData(output, 0, 0);
}

/**
 * Vignette gradient darkening
 */
function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
) {
  if (intensity <= 0) return;
  const radius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    radius * 0.35,
    width / 2,
    height / 2,
    radius
  );
  const alpha = (intensity / 100) * 0.85;
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);

  ctx.save();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Main rendering pipeline for the Photo Studio
 */
export async function renderCompositeCanvas({
  targetCanvas,
  baseImage,
  adjustments,
  transform,
  backgroundState,
  textOverlays = [],
  stickerOverlays = [],
  cutoutImage,
  customBgImage,
}: {
  targetCanvas: HTMLCanvasElement;
  baseImage: HTMLImageElement;
  adjustments: FilterAdjustments;
  transform: TransformState;
  backgroundState: BackgroundState;
  textOverlays?: TextOverlay[];
  stickerOverlays?: StickerOverlay[];
  cutoutImage?: HTMLImageElement | null;
  customBgImage?: HTMLImageElement | null;
}) {
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // Determine base dimensions based on crop or full image
  let srcX = 0;
  let srcY = 0;
  let srcWidth = baseImage.naturalWidth || baseImage.width;
  let srcHeight = baseImage.naturalHeight || baseImage.height;

  if (transform.crop) {
    srcX = Math.round(transform.crop.x * srcWidth);
    srcY = Math.round(transform.crop.y * srcHeight);
    srcWidth = Math.round(transform.crop.width * srcWidth);
    srcHeight = Math.round(transform.crop.height * srcHeight);
  }

  // Account for 90 or 270 degree rotation swapping width & height
  const isRotated90or270 =
    Math.abs(transform.rotation % 180) === 90 ||
    Math.abs(transform.rotation % 180) === 270;

  const destWidth = isRotated90or270 ? srcHeight : srcWidth;
  const destHeight = isRotated90or270 ? srcWidth : srcHeight;

  if (targetCanvas.width !== destWidth || targetCanvas.height !== destHeight) {
    targetCanvas.width = destWidth;
    targetCanvas.height = destHeight;
  }

  ctx.clearRect(0, 0, destWidth, destHeight);

  // 1. Draw Background Layer if we have a cutout subject
  if (cutoutImage && backgroundState.mode !== 'original') {
    if (backgroundState.mode === 'transparent') {
      // Keep clear for transparent PNG
    } else if (backgroundState.mode === 'solid') {
      ctx.fillStyle = backgroundState.solidColor || '#FFFFFF';
      ctx.fillRect(0, 0, destWidth, destHeight);
    } else if (backgroundState.mode === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, destWidth, destHeight);
      if (backgroundState.gradient === 'studio-softbox') {
        const rad = ctx.createRadialGradient(
          destWidth / 2,
          destHeight / 2,
          10,
          destWidth / 2,
          destHeight / 2,
          destWidth * 0.8
        );
        rad.addColorStop(0, '#f1f5f9');
        rad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = rad;
      } else if (backgroundState.gradient === 'sunset') {
        grad.addColorStop(0, '#ff7e5f');
        grad.addColorStop(1, '#feb47b');
        ctx.fillStyle = grad;
      } else if (backgroundState.gradient === 'cyberpunk') {
        grad.addColorStop(0, '#2e0854');
        grad.addColorStop(0.5, '#d946ef');
        grad.addColorStop(1, '#06b6d4');
        ctx.fillStyle = grad;
      } else if (backgroundState.gradient === 'dark-luxury') {
        grad.addColorStop(0, '#18181b');
        grad.addColorStop(1, '#09090b');
        ctx.fillStyle = grad;
      } else {
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = grad;
      }
      ctx.fillRect(0, 0, destWidth, destHeight);
    } else if (backgroundState.mode === 'blur') {
      // Draw heavily blurred original photo behind cutout
      ctx.save();
      ctx.filter = `blur(${Math.max(5, backgroundState.blurStrength || 20)}px)`;
      ctx.drawImage(
        baseImage,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        -10,
        -10,
        destWidth + 20,
        destHeight + 20
      );
      ctx.restore();
    } else if (backgroundState.mode === 'custom_image' && customBgImage) {
      ctx.drawImage(customBgImage, 0, 0, destWidth, destHeight);
    }
  }

  // 2. Draw Image Subject (either Cutout or Base Image)
  const imageToDraw =
    cutoutImage && backgroundState.mode !== 'original' ? cutoutImage : baseImage;

  ctx.save();

  // Handle Rotation and Flipping around center
  ctx.translate(destWidth / 2, destHeight / 2);

  if (transform.rotation !== 0) {
    ctx.rotate((transform.rotation * Math.PI) / 180);
  }
  const scaleX = transform.flipH ? -1 : 1;
  const scaleY = transform.flipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Standard CSS-compatible filters
  const brightnessVal = 100 + adjustments.brightness;
  const contrastVal = 100 + adjustments.contrast;
  const saturateVal = 100 + adjustments.saturation;
  const blurVal = adjustments.blur;
  const sepiaVal = adjustments.sepia;
  const grayscaleVal = adjustments.grayscale;
  const invertVal = adjustments.invert;
  const hueVal = adjustments.hueRotate;

  ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%) blur(${blurVal}px) sepia(${sepiaVal}%) grayscale(${grayscaleVal}%) invert(${invertVal}%) hue-rotate(${hueVal}deg)`;

  const drawX = -srcWidth / 2;
  const drawY = -srcHeight / 2;

  if (imageToDraw === cutoutImage) {
    ctx.drawImage(imageToDraw, drawX, drawY, srcWidth, srcHeight);
  } else {
    ctx.drawImage(
      imageToDraw,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      drawX,
      drawY,
      srcWidth,
      srcHeight
    );
  }

  ctx.restore();

  // 3. Pixel-level Color Grading (Temperature, Tint, Exposure, Highlights, Shadows, Film Grain)
  if (
    adjustments.temperature !== 0 ||
    adjustments.tint !== 0 ||
    adjustments.highlights !== 0 ||
    adjustments.shadows !== 0 ||
    adjustments.exposure !== 0 ||
    adjustments.grain !== 0
  ) {
    try {
      const imageData = ctx.getImageData(0, 0, destWidth, destHeight);
      applyColorGrade(imageData, adjustments);
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      console.warn('Canvas pixel manipulation skipped:', e);
    }
  }

  // 4. Sharpening filter
  if (adjustments.sharpness > 0) {
    try {
      applySharpening(ctx, destWidth, destHeight, adjustments.sharpness);
    } catch (e) {
      console.warn('Sharpening skipped:', e);
    }
  }

  // 5. Vignette filter
  if (adjustments.vignette > 0) {
    drawVignette(ctx, destWidth, destHeight, adjustments.vignette);
  }

  // 6. Text Overlays
  for (const textItem of textOverlays) {
    ctx.save();
    const x = (textItem.x / 100) * destWidth;
    const y = (textItem.y / 100) * destHeight;

    ctx.translate(x, y);
    if (textItem.rotation) {
      ctx.rotate((textItem.rotation * Math.PI) / 180);
    }

    ctx.font = `${textItem.fontWeight} ${textItem.fontSize}px "${textItem.fontFamily}", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(textItem.text);
    const paddingX = 14;
    const paddingY = 8;
    const textHeight = textItem.fontSize;

    if (textItem.backgroundColor) {
      ctx.fillStyle = textItem.backgroundColor;
      ctx.beginPath();
      ctx.roundRect(
        -metrics.width / 2 - paddingX,
        -textHeight / 2 - paddingY,
        metrics.width + paddingX * 2,
        textHeight + paddingY * 2,
        8
      );
      ctx.fill();
    }

    if (textItem.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    ctx.fillStyle = textItem.color;
    ctx.fillText(textItem.text, 0, 0);

    ctx.restore();
  }

  // 7. Sticker Overlays (emojis/badges)
  for (const sticker of stickerOverlays) {
    ctx.save();
    const x = (sticker.x / 100) * destWidth;
    const y = (sticker.y / 100) * destHeight;

    ctx.translate(x, y);
    if (sticker.rotation) {
      ctx.rotate((sticker.rotation * Math.PI) / 180);
    }
    const size = Math.round(52 * (sticker.scale || 1));
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sticker.emoji, 0, 0);
    ctx.restore();
  }
}

/**
 * High-performance smart background isolation and green-screen/chroma cutout
 * Converts chroma solid or white studio backdrops into transparent PNGs with edge antialiasing
 */
export function processBackgroundCutout(
  imageElement: HTMLImageElement,
  keyColor: 'chroma_green' | 'white' | 'auto' = 'auto',
  tolerance: number = 45,
  featherRadius: number = 2
): string {
  const canvas = document.createElement('canvas');
  const w = imageElement.naturalWidth || imageElement.width;
  const h = imageElement.naturalHeight || imageElement.height;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return imageElement.src;

  ctx.drawImage(imageElement, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Determine key color target
  let targetR = 0;
  let targetG = 255;
  let targetB = 0;

  if (keyColor === 'auto') {
    // Sample four corners to determine key color
    const cornerIndices = [
      0, // top-left
      (w - 1) * 4, // top-right
      (h - 1) * w * 4, // bottom-left
      ((h - 1) * w + (w - 1)) * 4, // bottom-right
    ];

    let avgR = 0,
      avgG = 0,
      avgB = 0;
    cornerIndices.forEach((idx) => {
      avgR += data[idx];
      avgG += data[idx + 1];
      avgB += data[idx + 2];
    });
    targetR = Math.round(avgR / 4);
    targetG = Math.round(avgG / 4);
    targetB = Math.round(avgB / 4);
  } else if (keyColor === 'white') {
    targetR = 255;
    targetG = 255;
    targetB = 255;
  }

  // Alpha mask pass
  const tolSq = tolerance * tolerance;
  const featherSq = (tolerance + featherRadius * 15) * (tolerance + featherRadius * 15);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Chroma green detection check (if strong green dominant)
    const isPureGreen = g > 130 && g > r * 1.35 && g > b * 1.35;

    if (isPureGreen && keyColor !== 'white') {
      const greenDominance = g - Math.max(r, b);
      if (greenDominance > tolerance) {
        data[i + 3] = 0;
      } else {
        data[i + 3] = Math.max(0, Math.min(255, 255 - (greenDominance / tolerance) * 255));
      }
      continue;
    }

    // Euclidean color distance from target background
    const distSq =
      Math.pow(r - targetR, 2) + Math.pow(g - targetG, 2) + Math.pow(b - targetB, 2);

    if (distSq <= tolSq) {
      data[i + 3] = 0; // completely transparent
    } else if (distSq < featherSq) {
      const alpha = (distSq - tolSq) / (featherSq - tolSq);
      data[i + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}
