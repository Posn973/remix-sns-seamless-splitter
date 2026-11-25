/**
 * Helper to calculate greatest common divisor
 */
function gcd(a: number, b: number): number {
  a = Math.round(Math.abs(a));
  b = Math.round(Math.abs(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

interface KnownRatio {
  w: number;
  h: number;
  label: string;
  name: string;
}

const KNOWN_RATIOS: KnownRatio[] = [
  { w: 16, h: 9, label: '16:9', name: 'ワイド横長 (YouTube / X横画像)' },
  { w: 9, h: 16, label: '9:16', name: 'タテ型 (TikTok / リール / ストーリーズ)' },
  { w: 4, h: 3, label: '4:3', name: 'スタンダード横 (写真標準)' },
  { w: 3, h: 4, label: '3:4', name: 'スタンダード縦' },
  { w: 1, h: 1, label: '1:1', name: '正方形 (スクエア / Instagram)' },
  { w: 3, h: 2, label: '3:2', name: '35mmフィルム横 (一眼レフ)' },
  { w: 2, h: 3, label: '2:3', name: '35mmフィルム縦' },
  { w: 21, h: 9, label: '21:9', name: 'シネマスコープ / 超ウルトラワイド' },
  { w: 4, h: 5, label: '4:5', name: 'Instagram縦投稿' },
  { w: 5, h: 4, label: '5:4', name: '大判写真' },
  { w: 2, h: 1, label: '2:1', name: 'パノラマ' },
];

export interface RatioAnalysis {
  exactRatio: number; // width / height
  ratioString: string;
  matchedStandard: KnownRatio | null;
  displayLabel: string;
  orientation: 'landscape' | 'portrait' | 'square';
  orientationLabel: string;
}

export function analyzeAspectRatio(width: number, height: number): RatioAnalysis {
  if (width <= 0 || height <= 0) {
    return {
      exactRatio: 1,
      ratioString: '1:1',
      matchedStandard: null,
      displayLabel: '1:1',
      orientation: 'square',
      orientationLabel: '正方形',
    };
  }

  const exactRatio = width / height;

  let orientation: 'landscape' | 'portrait' | 'square' = 'square';
  let orientationLabel = '正方形 (1:1)';
  if (exactRatio > 1.02) {
    orientation = 'landscape';
    orientationLabel = '横長画像 (Landscape)';
  } else if (exactRatio < 0.98) {
    orientation = 'portrait';
    orientationLabel = '縦長画像 (Portrait)';
  }

  // Find nearest known ratio within 2.5% tolerance
  let matched: KnownRatio | null = null;
  let minDiff = Infinity;

  for (const known of KNOWN_RATIOS) {
    const knownRatio = known.w / known.h;
    const diff = Math.abs(exactRatio - knownRatio) / knownRatio;
    if (diff < 0.035 && diff < minDiff) {
      minDiff = diff;
      matched = known;
    }
  }

  // Compute reduced integer ratio as fallback
  const d = gcd(width, height);
  const rw = Math.round(width / d);
  const rh = Math.round(height / d);

  const ratioString = matched
    ? matched.label
    : rw <= 32 && rh <= 32
    ? `${rw}:${rh}`
    : `${exactRatio.toFixed(2)}:1`;

  const displayLabel = matched
    ? `${matched.label} (${matched.name})`
    : `${ratioString} (${exactRatio.toFixed(2)}:1)`;

  return {
    exactRatio,
    ratioString,
    matchedStandard: matched,
    displayLabel,
    orientation,
    orientationLabel,
  };
}
