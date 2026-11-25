import React, { useState, useEffect, useRef } from 'react';
import { SliceResult, SplitConfig, OutputFormat } from '../types';
import { requestFullscreenAndLockPortrait, exitFullscreenAndUnlock } from '../utils/orientation';
import {
  Download,
  Copy,
  Check,
  Smartphone,
  LayoutGrid,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Split,
  ZoomIn,
  ZoomOut,
  Twitter,
  Instagram,
  Info,
  Maximize2,
  Minimize2,
  RotateCw,
  X,
  Eye,
} from 'lucide-react';
import { triggerDownload, getFileExtension } from '../utils/zipExport';

interface SnsPostPreviewProps {
  slices: SliceResult[];
  config: SplitConfig;
  format: OutputFormat;
  baseName: string;
}

type TabType = 'gap_preview' | 'x_sim' | 'carousel' | 'cards';

export const SnsPostPreview: React.FC<SnsPostPreviewProps> = ({
  slices,
  config,
  format,
  baseName,
}) => {
  // Default to the new Gap-Reproduction Preview (〇等分で〇px離したイメージ画像)
  const [activeTab, setActiveTab] = useState<TabType>('gap_preview');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [previewBg, setPreviewBg] = useState<'black' | 'dark' | 'light'>('black');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isRotated90, setIsRotated90] = useState<boolean>(false);

  // Scaled gap measurements in CSS pixels
  const normalImgRef = useRef<HTMLImageElement>(null);
  const fullscreenImgRef = useRef<HTMLImageElement>(null);
  const [normalScaleRatio, setNormalScaleRatio] = useState<number>(0.15);
  const [normalGapPx, setNormalGapPx] = useState<number>(1.8);
  const [fullscreenScaleRatio, setFullscreenScaleRatio] = useState<number>(0.3);
  const [fullscreenGapPx, setFullscreenGapPx] = useState<number>(3.6);

  const isVerticalSplit = config.direction === 'vertical';
  const seamTrim = config.seamTrimPx || 0;
  const splitCount = slices.length;

  const updateScaleAndGaps = () => {
    if (slices.length > 0 && slices[0]) {
      const rawSlice = slices[0];
      const rawDim = isVerticalSplit ? rawSlice.height : rawSlice.width;

      if (normalImgRef.current && rawDim > 0) {
        const rect = normalImgRef.current.getBoundingClientRect();
        const renderedDim = isVerticalSplit
          ? (rect.height || normalImgRef.current.clientHeight)
          : (rect.width || normalImgRef.current.clientWidth);
        if (renderedDim > 0) {
          const ratio = renderedDim / rawDim;
          setNormalScaleRatio(ratio);
          setNormalGapPx(Math.max(0.5, Math.round(seamTrim * ratio * 10) / 10));
        }
      }

      if (fullscreenImgRef.current && rawDim > 0) {
        const rect = fullscreenImgRef.current.getBoundingClientRect();
        const renderedDim = isVerticalSplit
          ? (rect.height || fullscreenImgRef.current.clientHeight)
          : (rect.width || fullscreenImgRef.current.clientWidth);
        if (renderedDim > 0) {
          const ratio = renderedDim / rawDim;
          setFullscreenScaleRatio(ratio);
          setFullscreenGapPx(Math.max(0.5, Math.round(seamTrim * ratio * 10) / 10));
        }
      }
    }
  };

  useEffect(() => {
    updateScaleAndGaps();
    const timer1 = setTimeout(updateScaleAndGaps, 50);
    const timer2 = setTimeout(updateScaleAndGaps, 200);
    const timer3 = setTimeout(updateScaleAndGaps, 600);
    window.addEventListener('resize', updateScaleAndGaps);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', updateScaleAndGaps);
    };
  }, [slices, seamTrim, isVerticalSplit, zoomScale, isFullscreen, isRotated90, activeTab]);

  // Toggle 90 degrees rotation (0 <-> 90)
  const handleToggleRotate90 = () => {
    requestFullscreenAndLockPortrait();
    setIsRotated90((prev) => !prev);
  };

  // Open fullscreen with default 90-degree landscape view + direct orientation lock
  const handleOpenFullscreen = () => {
    requestFullscreenAndLockPortrait();
    setIsRotated90(true);
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    exitFullscreenAndUnlock();
    setIsFullscreen(false);
  };

  // Prevent background scroll and exit fullscreen when unmounted
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      exitFullscreenAndUnlock();
    }
    return () => {
      document.body.style.overflow = '';
      exitFullscreenAndUnlock();
    };
  }, [isFullscreen]);

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
      console.error(err);
      alert('クリップボードへのコピーに失敗しました。「保存」ボタンからダウンロードしてください。');
    }
  };

  if (slices.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5 text-slate-200">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Split className="w-5 h-5 text-sky-400" />
            分割プレビュー &amp; SNS投稿シミュレーション
          </h3>
          <p className="text-xs text-slate-400">
            {splitCount}等分 • {seamTrim}pxの余白分離を考慮した投稿イメージを確認できます
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          {/* TAB 1: 〇等分で〇px離したイメージ画像 */}
          <button
            id="tab-gap-preview-btn"
            onClick={() => setActiveTab('gap_preview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'gap_preview'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>{splitCount}等分・{seamTrim}px分離イメージ</span>
          </button>

          {/* TAB 2: Xレイアウト */}
          <button
            id="tab-x-sim-btn"
            onClick={() => setActiveTab('x_sim')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'x_sim'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Twitter className="w-3.5 h-3.5 fill-current" />
            <span>X (Twitter) 投稿枠</span>
          </button>

          {/* TAB 3: Instagram スワイプ */}
          <button
            id="tab-carousel-btn"
            onClick={() => setActiveTab('carousel')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'carousel'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram スワイプ</span>
          </button>

          {/* TAB 4: 個別カード */}
          <button
            id="tab-cards-btn"
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
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

      {/* ========================================================================= */}
      {/* Tab Content 1: 〇等分・〇px分離イメージ (新機能)                           */}
      {/* ========================================================================= */}
      {activeTab === 'gap_preview' && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
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

            {/* Background & Zoom & Fullscreen Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewBg('black')}
                  className={`px-2 py-1 rounded transition-colors ${previewBg === 'black' ? 'bg-black text-white font-bold border border-slate-700' : 'text-slate-400'}`}
                >
                  黒背景
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className={`px-2 py-1 rounded transition-colors ${previewBg === 'dark' ? 'bg-slate-800 text-white font-bold border border-slate-700' : 'text-slate-400'}`}
                >
                  暗灰色
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('light')}
                  className={`px-2 py-1 rounded transition-colors ${previewBg === 'light' ? 'bg-slate-200 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  白背景
                </button>
              </div>

              <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
                  className="p-1 text-slate-400 hover:text-white rounded"
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
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="拡大"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 大画面で確認 Button */}
              <button
                id="open-fullscreen-preview-btn"
                type="button"
                onClick={handleOpenFullscreen}
                className="px-3 py-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all border border-sky-400/30"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>大画面で確認</span>
              </button>
            </div>
          </div>

          {/* Informative Status Banner for Scale-Linked Gap Verification */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-sky-500/30 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-sky-300">縮尺連動リアルスケール補正適用中</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] text-slate-300 font-mono">
              <span>元画像トリミング: <strong className="text-white">{seamTrim}px</strong> (片側{seamTrim / 2}px)</span>
              <span className="text-slate-500">|</span>
              <span>画面縮小比率: <strong className="text-white">{(normalScaleRatio * 100).toFixed(1)}%</strong></span>
              <span className="text-slate-500">|</span>
              <span>表示上の隙間: <strong className="text-emerald-400 text-xs">{normalGapPx}px</strong></span>
            </div>
          </div>

          {/* Main Visual Display Area: Separated by exact scaled gap */}
          <div
            className={`w-full rounded-2xl border border-slate-800 p-3 sm:p-8 flex items-center justify-center overflow-x-auto min-h-[260px] sm:min-h-[320px] transition-colors ${
              previewBg === 'black'
                ? 'bg-black'
                : previewBg === 'dark'
                ? 'bg-slate-900'
                : 'bg-slate-100'
            }`}
          >
            <div
              className="transition-transform duration-100 origin-center max-w-full flex items-center justify-center"
              style={{ transform: `scale(${zoomScale})` }}
            >
              {isVerticalSplit ? (
                /* Horizontal sequence separated by accurately scaled gap */
                <div
                  className="flex items-center justify-center shadow-2xl rounded-xl p-1.5 max-w-full bg-slate-950/40 border border-slate-700/60"
                  style={{ gap: `${normalGapPx}px` }}
                >
                  {slices.map((slice, idx) => (
                    <div
                      key={idx}
                      className="relative group flex-shrink-0 inline-flex items-center justify-center bg-slate-900"
                    >
                      <img
                        ref={idx === 0 ? normalImgRef : undefined}
                        onLoad={updateScaleAndGaps}
                        src={slice.dataUrl}
                        alt={`Slice ${idx + 1}`}
                        className="h-[200px] sm:h-[340px] w-auto max-w-none block object-contain select-none"
                        draggable={false}
                      />
                      {/* Top Label Tag */}
                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700 text-sky-300 font-mono text-[9px] sm:text-[10px] font-bold shadow-md flex items-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity">
                        <span>{idx + 1}枚目</span>
                        <span className="hidden sm:inline text-slate-400 text-[9px] font-normal">({slice.width}×{slice.height})</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Vertical sequence separated by accurately scaled gap */
                <div
                  className="flex flex-col items-center justify-center shadow-2xl rounded-xl p-1.5 max-w-full bg-slate-950/40 border border-slate-700/60"
                  style={{ gap: `${normalGapPx}px` }}
                >
                  {slices.map((slice, idx) => (
                    <div
                      key={idx}
                      className="relative group flex-shrink-0 flex items-center justify-center bg-slate-900"
                    >
                      <img
                        ref={idx === 0 ? normalImgRef : undefined}
                        onLoad={updateScaleAndGaps}
                        src={slice.dataUrl}
                        alt={`Slice ${idx + 1}`}
                        className="w-[260px] sm:w-[440px] max-w-full h-auto block object-contain select-none"
                        draggable={false}
                      />
                      {/* Left Label Tag */}
                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700 text-sky-300 font-mono text-[9px] sm:text-[10px] font-bold shadow-md flex items-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity">
                        <span>{idx + 1}枚目</span>
                        <span className="hidden sm:inline text-slate-400 text-[9px] font-normal">({slice.width}×{slice.height})</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Indicator Info */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-2.5 text-xs text-slate-400">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-200 font-semibold">
                  【{splitCount}等分・{seamTrim}px ギャップ再現について】
                </span>
                <p className="mt-0.5">
                  SNSで画像同士の間に発生する余白（{seamTrim}px）を空けて表示しています。スマホで全体を大きく見たい場合は
                  <strong className="text-sky-300 ml-1">「大画面で確認」</strong>ボタンを押してください。
                </p>
              </div>
            </div>

            <button
              id="mobile-fullscreen-indicator-btn"
              type="button"
              onClick={handleOpenFullscreen}
              className="sm:hidden flex-shrink-0 px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>全画面</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab Content 2: X (Twitter) Simulation                                     */}
      {/* ========================================================================= */}
      {activeTab === 'x_sim' && (
        <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
          <div className="w-full max-w-lg bg-black rounded-2xl border border-slate-800 p-3 shadow-2xl space-y-2">
            {/* Tweet Header */}
            <div className="flex items-center gap-2 pb-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                U
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>SNS User</span>
                  <span className="text-[10px] text-slate-500 font-normal">@sns_user • 1分</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  写真{splitCount}分割の投稿テスト（{seamTrim}px ギャップ補正適用中）
                </div>
              </div>
            </div>

            {/* Grid layout depending on slices.length */}
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              {slices.length === 2 && (
                <div className="grid grid-cols-2 gap-0.5 aspect-[16/9]">
                  {slices.map((slice, idx) => (
                    <div key={idx} className="relative w-full h-full overflow-hidden bg-slate-950">
                      <img
                        src={slice.dataUrl}
                        alt={`X Slice ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-mono">
                        {idx + 1}枚目
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {slices.length === 3 && (
                <div className="grid grid-cols-2 gap-0.5 aspect-[16/9]">
                  <div className="relative w-full h-full overflow-hidden bg-slate-950 row-span-2">
                    <img
                      src={slices[0]?.dataUrl}
                      alt="X Slice 1"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-mono">
                      1枚目
                    </span>
                  </div>
                  <div className="relative w-full h-full overflow-hidden bg-slate-950">
                    <img
                      src={slices[1]?.dataUrl}
                      alt="X Slice 2"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-mono">
                      2枚目
                    </span>
                  </div>
                  <div className="relative w-full h-full overflow-hidden bg-slate-950">
                    <img
                      src={slices[2]?.dataUrl}
                      alt="X Slice 3"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-mono">
                      3枚目
                    </span>
                  </div>
                </div>
              )}

              {slices.length === 4 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[16/9]">
                  {slices.map((slice, idx) => (
                    <div key={idx} className="relative w-full h-full overflow-hidden bg-slate-950">
                      <img
                        src={slice.dataUrl}
                        alt={`X Slice ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-mono">
                        {idx + 1}枚目
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab Content 3: Instagram Swipe Carousel Simulation                        */}
      {/* ========================================================================= */}
      {activeTab === 'carousel' && (
        <div className="max-w-md mx-auto bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800">
          <div className="text-center mb-3">
            <span className="text-xs text-slate-400">
              スワイプまたは矢印ボタンで連続した繋がりを確認できます
            </span>
          </div>

          <div className="relative aspect-square sm:aspect-[4/5] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {slices[carouselIndex] && (
              <img
                src={slices[carouselIndex].dataUrl}
                alt={`Carousel slide ${carouselIndex + 1}`}
                className="w-full h-full object-contain"
              />
            )}

            {/* Slide Index Badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-mono backdrop-blur-sm">
              {carouselIndex + 1} / {slices.length}
            </div>

            {/* Navigation Arrows */}
            {carouselIndex > 0 && (
              <button
                id="carousel-prev-btn"
                type="button"
                onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {carouselIndex < slices.length - 1 && (
              <button
                id="carousel-next-btn"
                type="button"
                onClick={() => setCarouselIndex((i) => Math.min(slices.length - 1, i + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {slices.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                onClick={() => setCarouselIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  carouselIndex === idx ? 'w-6 bg-sky-400' : 'w-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Tab Content 4: Individual Cards View                                      */}
      {/* ========================================================================= */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {slices.map((slice) => (
            <div
              key={`slice-card-${slice.index}`}
              className="bg-slate-950 rounded-xl p-3 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-md"
            >
              <div>
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    {slice.index + 1}枚目
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {slice.width} × {slice.height} px
                  </span>
                </div>

                {/* Slice Image Preview */}
                <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800/80 aspect-square sm:aspect-auto sm:h-48 flex items-center justify-center">
                  <img
                    src={slice.dataUrl}
                    alt={`Slice ${slice.index + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Trimming Info */}
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between px-1">
                  <span>
                    削り: 前{slice.trimLeftOrTop}px / 後{slice.trimRightOrBottom}px
                  </span>
                  <span className="text-slate-400">
                    幅 {slice.width}px
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-900">
                <button
                  id={`download-slice-${slice.index}-btn`}
                  type="button"
                  onClick={() => handleDownloadSingle(slice)}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-slate-700"
                  title="この画像だけ保存"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>保存</span>
                </button>

                <button
                  id={`copy-slice-${slice.index}-btn`}
                  type="button"
                  onClick={() => handleCopySingle(slice)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border ${
                    copiedIndex === slice.index
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
                  }`}
                  title="画像をクリップボードにコピー"
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

      {/* ========================================================================= */}
      {/* FULLSCREEN / MOBILE MAXIMIZED MODAL VIEW                                  */}
      {/* ========================================================================= */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-2 sm:p-6 animate-in fade-in duration-200">
          {/* Top Bar: Controls and Close button */}
          <div className="flex items-center justify-between gap-2 p-2 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold font-mono">
                {splitCount}等分 • {seamTrim}px 分離
              </div>
              <span className="hidden sm:inline text-xs text-slate-300">
                {isVerticalSplit ? '横分割プレビュー（スマホ全画面）' : '縦分割プレビュー（スマホ全画面）'}
              </span>
            </div>

            {/* Middle: Background & Orientation controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Background Color */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPreviewBg('black')}
                  className={`px-2 py-1 rounded transition-colors ${previewBg === 'black' ? 'bg-black text-white font-bold border border-slate-700' : 'text-slate-400'}`}
                >
                  黒
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('dark')}
                  className={`px-2 py-1 rounded transition-colors ${previewBg === 'dark' ? 'bg-slate-800 text-white font-bold border border-slate-700' : 'text-slate-400'}`}
                >
                  灰
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBg('light')}
                  className={`px-2 py-1 rounded transition-colors ${previewBg === 'light' ? 'bg-slate-200 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  白
                </button>
              </div>

              {/* 90度回転トグルボタン (0° <-> 90°) */}
              <button
                id="rotate-90-btn"
                type="button"
                onClick={handleToggleRotate90}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                  isRotated90
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/30'
                    : 'bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border-indigo-500/40'
                }`}
                title={isRotated90 ? '90度回転表示中（タップで通常向きへ）' : '通常向き表示中（タップで90度回転へ）'}
              >
                <RotateCw className={`w-4 h-4 transition-transform duration-200 ${isRotated90 ? 'rotate-90 text-white' : 'text-indigo-300'}`} />
                <span>{isRotated90 ? '90°回転中' : '通常向き'}</span>
              </button>
            </div>

            {/* Right: Close (戻る) Button */}
            <button
              id="close-fullscreen-preview-btn"
              type="button"
              onClick={handleCloseFullscreen}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>通常画面に戻る</span>
            </button>
          </div>

          {/* Center: Full-Screen Display with Max Screen Area Utilization & 90deg Rotation Toggle */}
          <div
            className={`flex-1 w-full my-2 rounded-2xl border border-slate-800/80 p-2 sm:p-4 flex items-center justify-center overflow-hidden transition-colors ${
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
                maxWidth: isRotated90 ? 'calc(100vh - 120px)' : '100%',
                maxHeight: isRotated90 ? 'calc(100vw - 32px)' : '100%',
              }}
            >
              {isVerticalSplit ? (
                /* Horizontal sequence maximizing full width / height of device - accurately scaled gap */
                <div
                  className="flex items-center justify-center h-full max-h-full max-w-full p-1 bg-slate-950/40 rounded-xl border border-slate-700/60"
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
                        className="h-full w-auto max-w-none object-contain block select-none"
                        draggable={false}
                      />
                      {/* Subdued number badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-sky-300 font-mono text-[10px] font-bold border border-slate-700 shadow-lg">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Vertical sequence maximizing full height / width of device - accurately scaled gap */
                <div
                  className="flex flex-col items-center justify-center max-w-full max-h-full p-1 bg-slate-950/40 rounded-xl border border-slate-700/60"
                  style={{ gap: `${fullscreenGapPx}px` }}
                >
                  {slices.map((slice, idx) => (
                    <div
                      key={`fs-slice-${idx}`}
                      className="relative flex-shrink-0 w-[280px] sm:w-[480px] max-w-full flex items-center justify-center bg-slate-900"
                    >
                      <img
                        ref={idx === 0 ? fullscreenImgRef : undefined}
                        onLoad={updateScaleAndGaps}
                        src={slice.dataUrl}
                        alt={`Fullscreen Slice ${idx + 1}`}
                        className="w-full h-auto object-contain block select-none"
                        draggable={false}
                      />
                      {/* Subdued number badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-sky-300 font-mono text-[10px] font-bold border border-slate-700 shadow-lg">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar: Action Hints, Rotate & Back Buttons */}
          <div className="flex items-center justify-between p-2 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md text-xs text-slate-400 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                スマホの画面全体を活用して隙間 {seamTrim}px 補正の繋がりを確認中（90°ボタンで0°と90°を即座に切替）
              </span>
              <span className="sm:hidden text-[11px]">
                {isRotated90 ? '90°回転中（もう一度押すと元の向き）' : '90°回転でスマホ画面いっぱいに拡大'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleRotate90}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border ${
                  isRotated90
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border-indigo-500/40'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRotated90 ? 'rotate-90 text-white' : 'text-indigo-300'}`} />
                <span>{isRotated90 ? '0°に戻す' : '90°回転'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRotated90(false);
                  setIsFullscreen(false);
                }}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>閉じる</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
