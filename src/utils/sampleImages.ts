/**
 * Procedurally generates stylish sample images so users can immediately test 16:9 and 9:16 splits
 */
export interface SamplePreset {
  id: string;
  name: string;
  badge: string;
  width: number;
  height: number;
  description: string;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'landscape-16-9',
    name: '16:9 パノラマ風景・キャラクター',
    badge: '16:9 横長',
    width: 1920,
    height: 1080,
    description: '夕暮れの街並みとキャラクターが描かれたワイド画像 (1920×1080)',
  },
  {
    id: 'portrait-9-16',
    name: '9:16 縦長スマホ・キャラクター',
    badge: '9:16 縦長',
    width: 1080,
    height: 1920,
    description: '星空とキャラクターの全身ポスター (1080×1920)',
  },
  {
    id: 'ultrawide-21-9',
    name: '21:9 超横長シネマパノラマ',
    badge: '21:9 横長',
    width: 2520,
    height: 1080,
    description: '広大な地平線と複数の被写体 (2520×1080)',
  },
];

export function generateSampleImage(presetId: string): Promise<string> {
  return new Promise((resolve) => {
    const preset = SAMPLE_PRESETS.find((p) => p.id === presetId) || SAMPLE_PRESETS[0];
    const canvas = document.createElement('canvas');
    canvas.width = preset.width;
    canvas.height = preset.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve('');
      return;
    }

    const { width: w, height: h } = preset;

    if (presetId === 'portrait-9-16') {
      // 9:16 Portrait Canvas
      // Gradient sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0d1326');
      skyGrad.addColorStop(0.3, '#1f2d52');
      skyGrad.addColorStop(0.6, '#483564');
      skyGrad.addColorStop(0.85, '#9d5b7a');
      skyGrad.addColorStop(1, '#f8ad86');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 150; i++) {
        const sx = (Math.sin(i * 99) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 33) * 0.5 + 0.5) * (h * 0.7);
        const rad = (i % 3 === 0 ? 2 : 1) * (0.8 + Math.sin(i) * 0.5);
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moon
      ctx.beginPath();
      ctx.arc(w * 0.8, h * 0.18, 90, 0, Math.PI * 2);
      ctx.fillStyle = '#fef3c7';
      ctx.shadowColor = '#fef3c7';
      ctx.shadowBlur = 40;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Character Face Target 1 (Upper section)
      const cx1 = w * 0.5;
      const cy1 = h * 0.38;
      // Head silhouette / circle
      ctx.beginPath();
      ctx.arc(cx1, cy1, 140, 0, Math.PI * 2);
      ctx.fillStyle = '#fce7f3';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#be185d';
      ctx.stroke();

      // Face features
      ctx.fillStyle = '#374151';
      ctx.beginPath();
      ctx.arc(cx1 - 45, cy1 - 15, 14, 0, Math.PI * 2); // left eye
      ctx.arc(cx1 + 45, cy1 - 15, 14, 0, Math.PI * 2); // right eye
      ctx.fill();

      // Cheeks
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(cx1 - 55, cy1 + 25, 20, 0, Math.PI * 2);
      ctx.arc(cx1 + 55, cy1 + 25, 20, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.beginPath();
      ctx.arc(cx1, cy1 + 20, 35, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#e11d48';
      ctx.stroke();

      // Label "顔注意ゾーン"
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⭐ メインキャラクター ⭐', cx1, cy1 - 170);

      // Character Body / Clothing (Middle section)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(cx1 - 180, h * 0.85);
      ctx.lineTo(cx1 - 70, cy1 + 130);
      ctx.lineTo(cx1 + 70, cy1 + 130);
      ctx.lineTo(cx1 + 180, h * 0.85);
      ctx.closePath();
      ctx.fill();

      // Lower ground / lights
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, h * 0.85, w, h * 0.15);

      // Title Banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.roundRect?.(w * 0.08, h * 0.88, w * 0.84, 120, 24);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('9:16 Vertical SNS Split Sample', w * 0.5, h * 0.94);
    } else {
      // 16:9 or 21:9 Landscape Canvas
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.35, '#1e1b4b');
      skyGrad.addColorStop(0.65, '#581c87');
      skyGrad.addColorStop(0.85, '#9a3412');
      skyGrad.addColorStop(1, '#fbbf24');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Sun
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.62, 130, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 60;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Distant mountains
      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.7);
      ctx.lineTo(w * 0.2, h * 0.5);
      ctx.lineTo(w * 0.38, h * 0.65);
      ctx.lineTo(w * 0.65, h * 0.48);
      ctx.lineTo(w * 0.85, h * 0.68);
      ctx.lineTo(w, h * 0.55);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Foreground silhouettes & Key Face Markers to test alignment
      // Subject 1 (Left area ~ 22%)
      const s1x = w * 0.22;
      const s1y = h * 0.55;
      drawSampleFace(ctx, s1x, s1y, 70, 'キャラ A (左)');

      // Subject 2 (Center area ~ 50%)
      const s2x = w * 0.5;
      const s2y = h * 0.45;
      drawSampleFace(ctx, s2x, s2y, 85, 'センター主役 (中央)');

      // Subject 3 (Right area ~ 78%)
      const s3x = w * 0.78;
      const s3y = h * 0.55;
      drawSampleFace(ctx, s3x, s3y, 70, 'キャラ B (右)');

      // City buildings on bottom
      ctx.fillStyle = '#090d16';
      for (let bx = 0; bx < w; bx += 70) {
        const bh = 100 + ((bx * 37) % 180);
        ctx.fillRect(bx, h - bh, 60, bh);
        // Windows
        ctx.fillStyle = '#fbbf24';
        for (let wy = h - bh + 20; wy < h - 20; wy += 35) {
          ctx.fillRect(bx + 15, wy, 12, 16);
          ctx.fillRect(bx + 33, wy, 12, 16);
        }
        ctx.fillStyle = '#090d16';
      }

      // Guide Header Overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(w * 0.05, 40, w * 0.9, 100);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `📸 ${preset.name} - スライダーで顔を避けて分割位置を調整できます`,
        w * 0.5,
        105
      );
    }

    resolve(canvas.toDataURL('image/png'));
  });
}

function drawSampleFace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  name: string
) {
  // Face circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#d97706';
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(x - radius * 0.35, y - radius * 0.15, radius * 0.12, 0, Math.PI * 2);
  ctx.arc(x + radius * 0.35, y - radius * 0.15, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();

  // Cheeks
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.arc(x - radius * 0.45, y + radius * 0.2, radius * 0.16, 0, Math.PI * 2);
  ctx.arc(x + radius * 0.45, y + radius * 0.2, radius * 0.16, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.beginPath();
  ctx.arc(x, y + radius * 0.15, radius * 0.28, 0.1 * Math.PI, 0.9 * Math.PI, false);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#b91c1c';
  ctx.stroke();

  // Name Tag
  ctx.fillStyle = 'rgba(17, 24, 39, 0.85)';
  ctx.roundRect?.(x - 110, y + radius + 15, 220, 42, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + radius + 44);
}
