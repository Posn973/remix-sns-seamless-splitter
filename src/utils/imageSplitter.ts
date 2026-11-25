import { SliceResult, SplitConfig, OutputFormat, SplitCount } from '../types';

export interface SliceBounds {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  trimBefore: number;
  trimAfter: number;
}

/**
 * Calculates rectangular bounds for each slice in original image coordinates
 */
export function calculateSliceBounds(
  imgWidth: number,
  imgHeight: number,
  config: SplitConfig
): SliceBounds[] {
  if (imgWidth <= 0 || imgHeight <= 0) return [];

  const { count, positions, seamTrimPx } = config;
  const halfGap = Math.max(0, seamTrimPx / 2);
  const bounds: SliceBounds[] = [];

  // Ensure positions has count - 1 sorted valid values strictly ascending
  const rawCuts = [...positions].sort((a, b) => a - b);
  const cuts: number[] = [];
  const minGap = Math.min(0.03, 0.3 / count);

  for (let i = 0; i < count - 1; i++) {
    const rawVal = rawCuts[i] !== undefined ? rawCuts[i] : (i + 1) / count;
    // Keep cuts inside valid range and strictly ascending
    const minVal = i === 0 ? minGap : cuts[i - 1] + minGap;
    const maxVal = 1 - minGap - (count - 2 - i) * minGap;
    cuts.push(Math.max(minVal, Math.min(maxVal, rawVal)));
  }

  // Cut along vertical lines (left to right)
  {
    // Cut along vertical lines (left to right)
    const cutPx = cuts.map((p) => Math.round(p * imgWidth));

    for (let i = 0; i < count; i++) {
      let startX: number;
      let endX: number;
      let trimBefore = 0;
      let trimAfter = 0;

      if (i === 0) {
        startX = 0;
        endX = (cutPx[0] ?? Math.round(imgWidth / count)) - halfGap;
        trimAfter = halfGap;
      } else if (i === count - 1) {
        startX = (cutPx[i - 1] ?? Math.round((imgWidth * (count - 1)) / count)) + halfGap;
        endX = imgWidth;
        trimBefore = halfGap;
      } else {
        startX = (cutPx[i - 1] ?? Math.round((imgWidth * i) / count)) + halfGap;
        endX = (cutPx[i] ?? Math.round((imgWidth * (i + 1)) / count)) - halfGap;
        trimBefore = halfGap;
        trimAfter = halfGap;
      }

      // Safe clamp
      startX = Math.max(0, Math.min(imgWidth - 1, Math.round(startX)));
      endX = Math.max(startX + 1, Math.min(imgWidth, Math.round(endX)));
      const w = Math.max(1, Math.min(imgWidth - startX, endX - startX));

      bounds.push({
        index: i,
        x: startX,
        y: 0,
        width: w,
        height: imgHeight,
        trimBefore,
        trimAfter,
      });
    }
  }

  return bounds;
}

/**
 * Creates canvas slices from an HTMLImageElement with mobile memory protection
 */
export async function generateSlices(
  img: HTMLImageElement,
  config: SplitConfig,
  format: OutputFormat = 'image/png',
  quality = 0.95,
  isCancelled?: () => boolean
): Promise<SliceResult[]> {
  if (!img || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
    return [];
  }

  const bounds = calculateSliceBounds(img.naturalWidth, img.naturalHeight, config);
  const results: SliceResult[] = [];

  for (const b of bounds) {
    if (isCancelled && isCancelled()) {
      // Abort early if a newer generation was triggered
      return [];
    }

    const canvas = document.createElement('canvas');
    canvas.width = b.width;
    canvas.height = b.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: false });

    if (!ctx) {
      canvas.width = 0;
      canvas.height = 0;
      throw new Error('Canvas 2D context could not be created');
    }

    // High quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    try {
      ctx.drawImage(
        img,
        b.x,
        b.y,
        b.width,
        b.height,
        0,
        0,
        b.width,
        b.height
      );
    } catch (e) {
      console.warn('Canvas drawImage error caught:', e);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (bl) => {
          if (bl) resolve(bl);
          else reject(new Error('Failed to generate image slice blob'));
        },
        format,
        quality
      );
    });

    // Use memory-efficient ObjectURL instead of giant base64 strings to prevent mobile Chrome OOM crashes
    const dataUrl = URL.createObjectURL(blob);

    // Free canvas GPU memory immediately
    canvas.width = 0;
    canvas.height = 0;

    results.push({
      index: b.index,
      blob,
      dataUrl,
      width: b.width,
      height: b.height,
      sourceRect: {
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
      },
      trimLeftOrTop: b.trimBefore,
      trimRightOrBottom: b.trimAfter,
    });
  }

  return results;
}

/**
 * Helper to compute default equal split positions for any count (2..20)
 */
export function getDefaultSplitPositions(count: SplitCount): number[] {
  const positions: number[] = [];
  for (let i = 1; i < count; i++) {
    positions.push(i / count);
  }
  return positions;
}

