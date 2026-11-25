export type SplitCount =
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20;

export type SplitDirection = 'vertical';

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export type AppStep = 'upload' | 'setup' | 'edit' | 'preview';

export interface ImageMetadata {
  file?: File;
  name: string;
  url: string;
  width: number;
  height: number;
  aspectRatio: number; // width / height
  aspectRatioLabel: string;
  isStandardRatio: boolean;
  fileSize?: number;
  mimeType: string;
}

export interface SplitConfig {
  count: SplitCount;
  direction: SplitDirection;
  // Normalized cut line positions (0 to 1), sorted. Count - 1 lines.
  // e.g. for count=3: [0.333, 0.666]
  positions: number[];
  // Total gap trimmed in pixels (default: 12px, half on left, half on right)
  seamTrimPx: number;
}

export interface SliceResult {
  index: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sourceRect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  trimLeftOrTop: number;
  trimRightOrBottom: number;
}

