import JSZip from 'jszip';
import { SliceResult, OutputFormat } from '../types';

export function getFileExtension(format: OutputFormat): string {
  switch (format) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    default:
      return 'png';
  }
}

export interface ZipExportOptions {
  baseName: string;
  format: OutputFormat;
  slices: SliceResult[];
  onProgress?: (percent: number) => void;
}

export async function createZipArchive({
  baseName,
  format,
  slices,
  onProgress,
}: ZipExportOptions): Promise<Blob> {
  const zip = new JSZip();
  const ext = getFileExtension(format);

  // Clean base name
  const safeName = baseName.replace(/\.[^/.]+$/, '').trim() || 'sns_split_images';
  const now = new Date();

  // Convert every slice blob into a clean binary ArrayBuffer to guarantee
  // exact byte-for-byte image headers and compatibility across all OS viewers
  for (let idx = 0; idx < slices.length; idx++) {
    const slice = slices[idx];
    const paddedNum = String(idx + 1).padStart(2, '0');
    // Filename starts with numbers (01_, 02_, 03_, 04_) for easy SNS upload ordering
    const fileName = `${paddedNum}_${safeName}.${ext}`;

    // Extract raw ArrayBuffer binary data
    const arrayBuffer = await slice.blob.arrayBuffer();
    zip.file(fileName, arrayBuffer, {
      binary: true,
      date: now,
      createFolders: false,
    });
  }

  // Add README guide file for SNS posting order
  const infoText = `=== SNS Photo Splitter ===
分割枚数: ${slices.length}枚
ファイル名と推奨投稿順:
${slices
  .map(
    (s, i) =>
      ` ${i + 1}枚目: ${String(i + 1).padStart(2, '0')}_${safeName}.${ext} (${s.width}x${s.height}px)`
  )
  .join('\n')}

X(Twitter)への投稿方法:
- 5〜20枚分割の場合: 01から順に選択して投稿すると、複数枚投稿として順番に配置されます（X最大20枚投稿対応）
- 4枚分割の場合: 1枚目(左上) → 2枚目(右上) → 3枚目(左下) → 4枚目(右下) または タイムライン横並び
- 3枚分割の場合: 1枚目(左) → 2枚目(右上) → 3枚目(右下)
- 2枚分割の場合: 1枚目(左) → 2枚目(右) または タイムライン並び
Instagramカルーセルへの投稿方法:
- 1枚目から順に複数選択して投稿すると、スワイプで途切れなく繋がって表示されます。
`;

  zip.file('readme_sns_order.txt', infoText, {
    date: now,
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      mimeType: 'application/zip',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  return zipBlob;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
