import React, { useState, useEffect, useRef } from 'react';
import {
  SliceResult,
  SplitConfig,
  OutputFormat,
  ImageMetadata,
} from '../types';
import { requestFullscreenAndLockPortrait, exitFullscreenAndUnlock } from '../utils/orientation';
import { triggerDownload, getFileExtension, createZipArchive } from '../utils/zipExport';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  RotateCw,
  Download,
  Archive,
  FileType,
  CheckCircle2,
  Loader2,
  Split,
  Layers,
  Sparkles,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';

interface StepPreviewProps {
  metadata: ImageMetadata;
  slices: SliceResult[];
  config: SplitConfig;
  format: OutputFormat;
  baseName: string;
  onChangeFormat: (format: OutputFormat) => void;
  onChangeBaseName: (name: string) => void;
  onGoBackToSetup: () => void;
}

type TabType = 'gap_preview' | 'cards';

export const StepPreview: React.FC<StepPreviewProps> = ({
  metadata,
  slices,
  config,
  format,
  baseName,
  onChangeFormat,
  onChangeBaseName,
  onGoBackToSetup,
}) => {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('gap_preview');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [previewBg, setPreviewBg] = useState<'black' | 'dark' | 'light'>('black');
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Fullscreen Preview states
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRotated90, setIsRotated90] = useState<boolean>(true);

  // Export progress states
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [zipProgress, setZipProgress] = useState<number>(0);
  const [zipSuccess, setZipSuccess] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState(false);

  // Dynamic scaled gap references
  const normalImgRef = useRef<HTMLImageElement>(null);
  const fullscreenImgRef = useRef<HTMLImageElement>(null);
  const [normalGapPx, setNormalGapPx] = useState<number>(1.8);
  const [fullscreenGapPx, setFullscreenGapPx] = useState<number>(3.6);

  const seamTrim = config.seamTrimPx || 0;
  const splitCount = slices.length;
  const isDenseSplit = splitCount >= 6;

  const updateScaleAndGaps = () => {
    if (slices.length > 0 && slices[0]) {
      const rawSlice = slices[0];
      const rawDim = rawSlice.height;

      if (normalImgRef.current && rawDim > 0) {
        const rect = normalImgRef.current.getBoundingClientRect();
        const renderedDim = rect.height || normalImgRef.current.clientHeight;
        if (renderedDim > 0) {
          const ratio = renderedDim / rawDim;
          setNormalGapPx(Math.max(0.5, Math.round(seamTrim * ratio * 10) / 10));
        }
      }

      if (fullscreenImgRef.current && rawDim > 0) {
        const rect = fullscreenImgRef.current.getBoundingClientRect();
        const renderedDim = rect.height || fullscreenImgRef.current.clientHeight;
        if (renderedDim > 0) {
          const ratio = renderedDim / rawDim;
          setFullscreenGapPx(Math.max(0.5, Math.round(seamTrim * ratio * 10) / 10));
        }
      }
    }
  };

  useEffect(() => {
    updateScaleAndGaps();
    const timer1 = setTimeout(updateScaleAndGaps, 50);
    const timer2 = setTimeout(updateScaleAndGaps, 250);
    window.addEventListener('resize', updateScaleAndGaps);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateScaleAndGaps);
    };
  }, [slices, seamTrim, zoomScale, isFullscreen, isRotated90, activeTab]);

  // Fullscreen controls
  const handleOpenFullscreen = () => {
    requestFullscreenAndLockPortrait();
    setIsRotated90(true);
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    exitFullscreenAndUnlock();
    setIsFullscreen(false);
  };

  const handleToggleRotate90 = () => {
    requestFullscreenAndLockPortrait();
    setIsRotated90((prev) => !prev);
  };

  // ZIP download handler
  const handleZipDownload = async () => {
    if (slices.length === 0 || isExportingZip) return;

    try {
      setIsExportingZip(true);
      setZipProgress(0);
      setZipSuccess(false);

      const zipBlob = await createZipArchive({
        baseName,
        format,
        slices,
        onProgress: (p) => setZipProgress(p),
      });

      const ext = getFileExtension(format);
      const safeName = baseName.replace(/\.[^/.]+$/, '').trim() || 'sns_split_images';
      const zipFileName = `${safeName}_${slices.length}split.zip`;

      triggerDownload(zipBlob, zipFileName);
      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('ZIPファイルの作成中にエラーが発生しました。');
    } finally {
      setIsExportingZip(false);
    }
  };

  // Batch individual download handler
  const handleBatchDownload = async () => {
    if (slices.length === 0 || isBatchSaving || isExportingZip) return;
    const ext = getFileExtension(format);
    const safeName = baseName.replace(/\.[^/.]+$/, '').trim() || 'sns_split';

    try {
      setIsBatchSaving(true);
      setBatchSuccess(false);

      for (let i = 0; i < slices.length; i++) {
        const slice = slices[i];
        const filename = `${String(slice.index + 1).padStart(2, '0')}_${safeName}.${ext}`;
        triggerDownload(slice.blob, filename);
        // Delay between downloads to prevent browser pop-up blocking
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

  const handleDownloadSingle = (slice: SliceResult) => {
    const ext = getFileExtension(format);
    const safeName = baseName.replace(/\.[^/.]+$/, '').trim() || 'sns_split';
    const filename = `${String(slice.index + 1).padStart(2, '0')}_${safeName}.${ext}`;
    triggerDownload(slice.blob, filename);
  };

  const handleCopySingle = async (slice: SliceResult) => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ [slice.blob.type]: slice.blob });
        await navigator.clipboard.write([item]);
        setCopiedIndex(slice.index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        alert('このブラウザではクリップボードへの画像直接コピーがサポートされていません。「保存」をご利用ください。');
      }
    } catch (err) {
      alert('クリップボードへのコピーに失敗しました。「保存」ボタンからダウンロードしてください。');
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Top Header / Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <button
          id="preview-back-to-setup-btn"
          type="button"
          onClick={onGoBackToSetup}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 transition-all active:scale-95 cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>戻る（分割設定・編集へ）</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            {splitCount}枚分割完了 • {metadata.width}×{metadata.height}px
          </span>
          <button
            id="open-fullscreen-preview-main-btn"
            type="button"
            onClick={handleOpenFullscreen}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all border border-indigo-400/30 active:scale-95 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>大画面で確認</span>
          </button>
        </div>
      </div>

      {/* Export Controls & Action Panel */}
      <div className="w-full bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-slate-200">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          {/* Left: Prefix & Format Settings */}
          <div className="flex-1 space-y-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Step 3 • 確認と書き出し
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5 flex items-center gap-2">
                <Archive className="w-6 h-6 text-indigo-400" />
                分割画像の保存
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                全 {splitCount} 枚の分割画像とSNS投稿順ガイドを保存します。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Prefix */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ファイル名プレフィックス
                </label>
                <input
                  id="preview-basename-input"
                  type="text"
                  value={baseName}
                  onChange={(e) => onChangeBaseName(e.target.value)}
                  placeholder="sns_split"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400 transition-colors font-mono"
                />
              </div>

              {/* Format */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <FileType className="w-3.5 h-3.5 text-slate-400" />
                  保存形式
                </label>
                <select
                  id="preview-format-select"
                  value={format}
                  onChange={(e) => onChangeFormat(e.target.value as OutputFormat)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400 transition-colors cursor-pointer"
                >
                  <option value="image/png">PNG (最高画質・劣化なし推奨)</option>
                  <option value="image/jpeg">JPEG (写真向け・ファイルサイズ小)</option>
                  <option value="image/webp">WebP (軽量・高画質)</option>
                </select>
              </div>
            </div>

            {/* Generated names */}
            <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 text-[11px] text-slate-400">
              <span className="text-slate-300 font-semibold mr-1.5">出力ファイル名（投稿順）:</span>
              <span className="font-mono text-sky-300">
                {slices.map((_, i) => `${String(i + 1).padStart(2, '0')}_${baseName.replace(/\.[^/.]+$/, '').trim() || 'sns_split'}.${getFileExtension(format)}`).join(', ')}
              </span>
            </div>
          </div>

          {/* Right: Big Action Buttons (ZIP vs Individual Batch) with Ample Gap to Prevent Mis-clicks */}
          <div className="flex flex-col items-center lg:items-end justify-center min-w-[290px] gap-4 pt-2 lg:pt-0">
            {/* Primary ZIP Download Button */}
            <button
              id="download-all-zip-btn"
              type="button"
              disabled={isExportingZip || slices.length === 0}
              onClick={handleZipDownload}
              className={`w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-2xl font-bold text-sm sm:text-base text-white shadow-2xl transition-all duration-200 flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer ${
                zipSuccess
                  ? 'bg-emerald-600 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-600 hover:from-indigo-500 hover:via-sky-500 hover:to-indigo-500 shadow-sky-500/30 hover:scale-[1.02]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isExportingZip ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ZIP作成中... ({zipProgress}%)</span>
                </>
              ) : zipSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>ZIPダウンロード完了！</span>
                </>
              ) : (
                <>
                  <Archive className="w-5 h-5" />
                  <span>すべての分割画像をZIPで保存</span>
                </>
              )}
            </button>

            {/* Ample Gap Between Buttons to Prevent Mis-clicks (ユーザー指定: 誤タップ防止) */}
            <div className="h-1 sm:h-2" />

            {/* Batch Individual Download Button */}
            <button
              id="download-individual-batch-btn"
              type="button"
              disabled={isExportingZip || isBatchSaving || slices.length === 0}
              onClick={handleBatchDownload}
              className={`w-full sm:w-auto min-w-[280px] px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-all duration-200 flex items-center justify-center gap-2.5 shadow-xl active:scale-[0.98] cursor-pointer ${
                batchSuccess
                  ? 'bg-emerald-600 shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/30 shadow-emerald-900/30 hover:scale-[1.02]'
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

            <p className="text-[11px] text-slate-400 text-center lg:text-right">
              {splitCount}枚分割 • 隙間{seamTrim}px補正適用済
            </p>
          </div>
        </div>
      </div>

      {/* Preview Simulation Tabs & Visualizer Area (余白エリアの配置) */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 text-slate-200">
        {/* Tab Buttons: 〇等分・〇Px分離イメージ / 個別カード */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Split className="w-5 h-5 text-sky-400" />
              仕上がりプレビュー確認
            </h3>
            <p className="text-xs text-slate-400">
              余白分離の繋がりや個別の分割画像を確認できます
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs overflow-x-auto">
            {/* Tab 1: 〇等分・〇Px分離イメージ */}
            <button
              id="tab-gap-preview-btn"
              type="button"
              onClick={() => setActiveTab('gap_preview')}
              className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'gap_preview'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>{splitCount}等分・{seamTrim}Px分離イメージ</span>
            </button>

            {/* Tab 2: 個別カード (〇枚) */}
            <button
              id="tab-cards-btn"
              type="button"
              onClick={() => setActiveTab('cards')}
              className={`px-3 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'cards'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>個別カード ({splitCount}枚)</span>
            </button>
          </div>
        </div>

        {/* Tab 1 Content: 〇等分・〇Px分離イメージ */}
        {activeTab === 'gap_preview' && (
          <div className="space-y-4">
            {/* Viewport Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold font-mono">
                  {splitCount}等分 • {seamTrim}px ギャップ
                </div>
                <span className="text-xs text-slate-300">
                  {seamTrim > 0
                    ? `画像同士の間を ${seamTrim}px 離してSNS投稿時の余白ズレ相殺を再現`
                    : '隙間なし（0px）で並べて表示中'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Background Selector */}
                <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPreviewBg('black')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      previewBg === 'black' ? 'bg-black text-white font-bold border border-slate-700' : 'text-slate-400'
                    }`}
                  >
                    黒背景
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('dark')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      previewBg === 'dark' ? 'bg-slate-800 text-white font-bold border border-slate-700' : 'text-slate-400'
                    }`}
                  >
                    暗灰色
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('light')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      previewBg === 'light' ? 'bg-slate-200 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    白背景
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setZoomScale((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
                    className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                    title="縮小"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 text-[11px] font-mono text-slate-300">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
                    className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                    title="拡大"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Fullscreen Button */}
                <button
                  id="tab-gap-fullscreen-btn"
                  type="button"
                  onClick={handleOpenFullscreen}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all border border-sky-400/30 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>大画面で確認</span>
                </button>
              </div>
            </div>

            {/* Main Stage */}
            <div
              className={`w-full rounded-2xl border border-slate-800 p-4 sm:p-8 flex items-center justify-center overflow-x-auto min-h-[280px] sm:min-h-[360px] transition-colors ${
                previewBg === 'black'
                  ? 'bg-black'
                  : previewBg === 'dark'
                  ? 'bg-slate-900'
                  : 'bg-slate-100'
              }`}
            >
              <div
                className="transition-transform duration-100 origin-center flex items-center justify-center mx-auto w-max"
                style={{ transform: `scale(${zoomScale})` }}
              >
                <div
                  className="flex items-center justify-center shadow-2xl rounded-2xl p-2 bg-slate-950/40 border border-slate-700/60 w-max"
                  style={{ gap: `${normalGapPx}px` }}
                >
                  {slices.map((slice, idx) => (
                    <div
                      key={`gap-slice-${idx}`}
                      className="relative group flex-shrink-0 inline-flex items-center justify-center bg-slate-900"
                    >
                      <img
                        ref={idx === 0 ? normalImgRef : undefined}
                        onLoad={updateScaleAndGaps}
                        src={slice.dataUrl}
                        alt={`Slice ${idx + 1}`}
                        className="h-[200px] sm:h-[320px] w-auto max-w-none block object-contain select-none rounded-sm"
                        draggable={false}
                      />
                      <div
                        className={`absolute top-1.5 left-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700 text-sky-300 font-mono font-bold shadow-md ${
                          isDenseSplit ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
                        }`}
                      >
                        {isDenseSplit ? idx + 1 : `${idx + 1}枚目`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Content: Individual Cards */}
        {activeTab === 'cards' && (
          <div
            className={`grid gap-4 ${
              splitCount >= 10
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {slices.map((slice) => (
              <div
                key={`slice-card-${slice.index}`}
                className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      {slice.index + 1}枚目
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {slice.width} × {slice.height} px
                    </span>
                  </div>

                  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 aspect-square sm:aspect-auto sm:h-48 flex items-center justify-center">
                    <img
                      src={slice.dataUrl}
                      alt={`Slice ${slice.index + 1}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between px-1">
                    <span>
                      削り: 前{slice.trimLeftOrTop}px / 後{slice.trimRightOrBottom}px
                    </span>
                    <span>幅 {slice.width}px</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(slice)}
                    className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-700 cursor-pointer"
                    title="この画像だけ保存"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>保存</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopySingle(slice)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors border cursor-pointer ${
                      copiedIndex === slice.index
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
                    }`}
                  >
                    {copiedIndex === slice.index ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>コピー済</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>コピー</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FULLSCREEN PREVIEW MODAL (大画面で確認: 90°回転, 戻るボタン)               */}
      {/* ========================================================================= */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-2 sm:p-4 select-none animate-in fade-in duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between gap-2 p-2 sm:p-3 rounded-2xl bg-slate-900 border border-slate-800 backdrop-blur-md shadow-2xl flex-shrink-0 z-30">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold font-mono">
                {splitCount}等分 • {seamTrim}px ギャップ
              </div>
              <span className="hidden sm:inline text-xs text-slate-300">
                左右分割プレビュー（スマホ全画面）
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 90° Rotation Toggle Button */}
              <button
                id="fullscreen-rotate-toggle-btn"
                type="button"
                onClick={handleToggleRotate90}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                  isRotated90
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/30'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                }`}
                title="0°と90°の回転切り替え"
              >
                <RotateCw className={`w-3.5 h-3.5 transition-transform duration-200 ${isRotated90 ? 'rotate-90' : ''}`} />
                <span>{isRotated90 ? '90°回転中' : '通常向き'}</span>
              </button>

              {/* Back (戻る) Button */}
              <button
                id="fullscreen-close-btn"
                type="button"
                onClick={handleCloseFullscreen}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
                <span>戻る</span>
              </button>
            </div>
          </div>

          {/* Modal Fullscreen Stage with 90° rotation */}
          <div
            className={`flex-1 w-full my-2 rounded-2xl border border-slate-800 p-2 sm:p-4 flex items-center justify-center overflow-hidden transition-colors ${
              previewBg === 'black'
                ? 'bg-black'
                : previewBg === 'dark'
                ? 'bg-slate-900'
                : 'bg-slate-100'
            }`}
          >
            <div
              className="w-full h-full flex items-center justify-center transition-all duration-300"
              style={{
                transform: isRotated90 ? 'rotate(90deg)' : 'rotate(0deg)',
                width: isRotated90 ? '100vh' : '100%',
                height: isRotated90 ? '100vw' : '100%',
                maxWidth: isRotated90 ? 'calc(100vh - 100px)' : '100%',
                maxHeight: isRotated90 ? 'calc(100vw - 32px)' : '100%',
              }}
            >
              <div
                className="flex items-center justify-center h-full max-h-full max-w-full overflow-x-auto p-1 bg-slate-950/40 rounded-2xl border border-slate-700/60 shadow-2xl"
                style={{ gap: `${fullscreenGapPx}px` }}
              >
                {slices.map((slice, idx) => (
                  <div
                    key={`fs-slice-${idx}`}
                    className="relative flex-shrink-0 h-full max-h-full inline-flex items-center justify-center bg-slate-900"
                  >
                    <img
                      ref={idx === 0 ? fullscreenImgRef : undefined}
                      onLoad={updateScaleAndGaps}
                      src={slice.dataUrl}
                      alt={`Fullscreen Slice ${idx + 1}`}
                      className="h-full w-auto max-w-none object-contain block select-none rounded-sm"
                      draggable={false}
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-sky-300 font-mono text-[10px] font-bold border border-slate-700 shadow-lg">
                      {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Bottom Bar */}
          <div className="flex items-center justify-between p-2 sm:p-3 rounded-2xl bg-slate-900 border border-slate-800 backdrop-blur-md text-xs text-slate-400 flex-shrink-0 z-30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>大画面プレビュー（隙間 {seamTrim}px 補正の繋がりを確認中）</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleRotate90}
                className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border border-indigo-500/40 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isRotated90 ? '0°に戻す' : '90°回転'}</span>
              </button>

              <button
                type="button"
                onClick={handleCloseFullscreen}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>戻る</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
