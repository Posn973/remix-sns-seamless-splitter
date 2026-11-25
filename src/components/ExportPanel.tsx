import React, { useState } from 'react';
import { SliceResult, OutputFormat, SplitConfig } from '../types';
import { Archive, Download, FileType, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { createZipArchive, triggerDownload, getFileExtension } from '../utils/zipExport';

interface ExportPanelProps {
  slices: SliceResult[];
  config: SplitConfig;
  baseName: string;
  format: OutputFormat;
  onChangeFormat: (format: OutputFormat) => void;
  onChangeBaseName: (name: string) => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  slices,
  config,
  baseName,
  format,
  onChangeFormat,
  onChangeBaseName,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState(false);

  const handleZipDownload = async () => {
    if (slices.length === 0 || isExporting) return;

    try {
      setIsExporting(true);
      setProgress(0);
      setDownloadSuccess(false);

      const zipBlob = await createZipArchive({
        baseName,
        format,
        slices,
        onProgress: (p) => setProgress(p),
      });

      const ext = getFileExtension(format);
      const safeName = baseName.replace(/\.[^/.]+$/, '').trim() || 'sns_split_images';
      const zipFileName = `${safeName}_${slices.length}split.zip`;

      triggerDownload(zipBlob, zipFileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('ZIPファイルの作成中にエラーが発生しました。');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchDownload = async () => {
    if (slices.length === 0 || isBatchSaving || isExporting) return;
    const ext = getFileExtension(format);
    const safeName = baseName.replace(/\.[^/.]+$/, '').trim() || 'sns_split';

    try {
      setIsBatchSaving(true);
      setBatchSuccess(false);

      for (let i = 0; i < slices.length; i++) {
        const slice = slices[i];
        const filename = `${String(slice.index + 1).padStart(2, '0')}_${safeName}.${ext}`;
        triggerDownload(slice.blob, filename);
        // Small delay between downloads to prevent browser blocking
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      setBatchSuccess(true);
      setTimeout(() => setBatchSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('保存中にエラーが発生しました。');
    } finally {
      setIsBatchSaving(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-200">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Left: Format & Naming Settings */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Archive className="w-5 h-5 text-indigo-400" />
              一括エクスポート &amp; ZIPダウンロード
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              全 {slices.length} 枚の分割画像とSNS投稿順序ガイドをまとめたZIPファイルを保存します
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Base File Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ファイル名プレフィックス
              </label>
              <input
                id="export-basename-input"
                type="text"
                value={baseName}
                onChange={(e) => onChangeBaseName(e.target.value)}
                placeholder="sns_split"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-400 transition-colors font-mono"
              />
            </div>

            {/* Output Format */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <FileType className="w-3.5 h-3.5 text-slate-400" />
                保存形式
              </label>
              <select
                id="export-format-select"
                value={format}
                onChange={(e) => onChangeFormat(e.target.value as OutputFormat)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-sky-400 transition-colors"
              >
                <option value="image/png">PNG (最高画質・劣化なし推奨)</option>
                <option value="image/jpeg">JPEG (写真向け・ファイルサイズ小)</option>
                <option value="image/webp">WebP (軽量・高画質)</option>
              </select>
            </div>
          </div>

          {/* Generated Filenames Preview */}
          <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 text-[11px] text-slate-400">
            <span className="text-slate-300 font-semibold mr-1.5">出力ファイル名（投稿順）:</span>
            <span className="font-mono text-sky-300">
              {slices.map((_, i) => `${String(i + 1).padStart(2, '0')}_${baseName.replace(/\.[^/.]+$/, '').trim() || 'sns_split'}.${getFileExtension(format)}`).join(', ')}
            </span>
          </div>
        </div>

        {/* Right: Big ZIP Download Button & Batch Individual Download */}
        <div className="flex flex-col items-center lg:items-end justify-center min-w-[280px] gap-4">
          <button
            id="download-all-zip-btn"
            type="button"
            disabled={isExporting || slices.length === 0}
            onClick={handleZipDownload}
            className={`w-full sm:w-auto min-w-[280px] px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-xl transition-all duration-200 flex items-center justify-center gap-2.5 ${
              downloadSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:via-sky-500 hover:to-indigo-500 shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.98]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>ZIP作成中... ({progress}%)</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>ZIPダウンロード完了！</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>すべての分割画像をZIPで保存</span>
              </>
            )}
          </button>

          <button
            id="download-individual-batch-btn"
            type="button"
            disabled={isExporting || isBatchSaving || slices.length === 0}
            onClick={handleBatchDownload}
            className={`w-full sm:w-auto min-w-[280px] px-8 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg ${
              batchSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 border border-emerald-400/30 shadow-emerald-900/30 hover:scale-[1.02] active:scale-[0.98]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isBatchSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>保存中... (全{slices.length}枚)</span>
              </>
            ) : batchSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <span>ダウンロードが完了しました！</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5 text-emerald-100" />
                <span>ZIP無しで全{slices.length}枚を保存</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center lg:text-right mt-1">
            {slices.length}枚分割 (12px隙間補正済) • 純バイナリ出力で全ビューワー対応
          </p>
        </div>
      </div>
    </div>
  );
};
