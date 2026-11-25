import React, { useState } from 'react';
import { SplitConfig, SplitCount, ImageMetadata } from '../types';
import { getDefaultSplitPositions } from '../utils/imageSplitter';
import {
  Sliders,
  RotateCcw,
  Scissors,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SplitControlsProps {
  metadata: ImageMetadata;
  config: SplitConfig;
  onChangeConfig: (newConfig: SplitConfig) => void;
  onResetEqual: () => void;
}

const SPLIT_COUNT_OPTIONS: SplitCount[] = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
];

export const SplitControls: React.FC<SplitControlsProps> = ({
  metadata,
  config,
  onChangeConfig,
  onResetEqual,
}) => {
  const { count, positions, seamTrimPx } = config;
  const totalDimension = metadata.width;

  // Accordion open/close states
  const [isOpenPositions, setIsOpenPositions] = useState<boolean>(false);
  const [isOpenSeamTrim, setIsOpenSeamTrim] = useState<boolean>(false);

  const handleCountChange = (newCount: SplitCount) => {
    if (newCount === count) return;
    const newPositions = getDefaultSplitPositions(newCount);
    onChangeConfig({
      ...config,
      count: newCount,
      direction: 'vertical',
      positions: newPositions,
    });
  };

  const handleSeamTrimChange = (newTrimPx: number) => {
    const clamped = Math.max(0, Math.min(20, Math.round(newTrimPx)));
    onChangeConfig({
      ...config,
      seamTrimPx: clamped,
    });
  };

  const handlePositionSlider = (index: number, value: number) => {
    const newPositions = [...positions];
    const minDistance = 0.04;
    const prevLimit = index === 0 ? minDistance : newPositions[index - 1] + minDistance;
    const nextLimit =
      index === newPositions.length - 1 ? 1 - minDistance : newPositions[index + 1] - minDistance;

    newPositions[index] = Math.max(prevLimit, Math.min(nextLimit, value));
    onChangeConfig({
      ...config,
      positions: newPositions,
    });
  };

  const handleNudgePixel = (index: number, deltaPx: number) => {
    if (totalDimension <= 0) return;
    const deltaNormalized = deltaPx / totalDimension;
    const current = positions[index];
    handlePositionSlider(index, current + deltaNormalized);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4 text-slate-200">
      {/* Top Section: Split Count (Unified Left-Right Split) */}
      <div className="pb-4 border-b border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-sky-400" />
              分割枚数（左右分割）
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              {count}枚に分割 (線 {count - 1}本)
            </span>
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {SPLIT_COUNT_OPTIONS.map((c) => (
              <button
                key={c}
                id={`split-count-${c}-btn`}
                type="button"
                onClick={() => handleCountChange(c)}
                className={`py-2.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                  count === c
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{c}分割</span>
                <span className="text-[10px] opacity-80 font-normal hidden lg:inline">(X{c}枚)</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Section (Accordion): Sliders for Each Cut Line */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden transition-all">
        <button
          id="toggle-positions-accordion-btn"
          type="button"
          onClick={() => setIsOpenPositions((prev) => !prev)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">分割位置スライダー</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {positions.length}本の分割線
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                顔や重要部分を避けて境界線をミリ単位で調整
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-amber-400 font-medium hidden sm:inline">
              {isOpenPositions ? '閉じる' : 'タップして調整'}
            </span>
            <div className="p-1 rounded-md bg-slate-800 text-slate-300">
              {isOpenPositions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </button>

        {isOpenPositions && (
          <div className="p-4 pt-2 border-t border-slate-800/80 bg-slate-950/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                分割線の位置を手動でスライド調整できます
              </span>
              <button
                id="reset-equal-split-btn"
                type="button"
                onClick={onResetEqual}
                className="px-2.5 py-1 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>均等に戻す</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {positions.map((pos, idx) => {
                const pixelVal = Math.round(pos * totalDimension);
                const pctVal = (pos * 100).toFixed(1);

                return (
                  <div key={`slider-control-${idx}`} className="space-y-1.5 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        分割線 #{idx + 1}
                        <span className="text-[11px] font-normal text-slate-400">
                          ({idx + 1}枚目 と {idx + 2}枚目の境界)
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-bold">{pixelVal} px</span>
                        <span className="text-slate-400 font-mono text-[11px]">({pctVal}%)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Step -5px */}
                      <button
                        id={`nudge-minus-${idx}`}
                        type="button"
                        onClick={() => handleNudgePixel(idx, -5)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-mono"
                        title="-5px 微調整"
                      >
                        -5px
                      </button>
                      <button
                        id={`nudge-minus-1-${idx}`}
                        type="button"
                        onClick={() => handleNudgePixel(idx, -1)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700"
                        title="-1px 微調整"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* Range Slider */}
                      <div className="flex-1 relative flex items-center">
                        <input
                          id={`line-position-slider-${idx}`}
                          type="range"
                          min={0.05}
                          max={0.95}
                          step={0.001}
                          value={pos}
                          onChange={(e) => handlePositionSlider(idx, parseFloat(e.target.value))}
                          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                      </div>

                      {/* Step +1px */}
                      <button
                        id={`nudge-plus-1-${idx}`}
                        type="button"
                        onClick={() => handleNudgePixel(idx, 1)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700"
                        title="+1px 微調整"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`nudge-plus-${idx}`}
                        type="button"
                        onClick={() => handleNudgePixel(idx, 5)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-mono"
                        title="+5px 微調整"
                      >
                        +5px
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section (Accordion): Seam Gutter Trimming */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden transition-all">
        <button
          id="toggle-seam-trim-accordion-btn"
          type="button"
          onClick={() => setIsOpenSeamTrim((prev) => !prev)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">分割線の間を削るピクセル幅</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 border border-sky-500/30 text-sky-300 font-mono">
                  {seamTrimPx}px (片側{seamTrimPx / 2}px)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                SNS余白によるズレを相殺するトリミング設定
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-sky-400 font-medium hidden sm:inline">
              {isOpenSeamTrim ? '閉じる' : 'タップして調整'}
            </span>
            <div className="p-1 rounded-md bg-slate-800 text-slate-300">
              {isOpenSeamTrim ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </button>

        {isOpenSeamTrim && (
          <div className="p-4 pt-2 border-t border-slate-800/80 bg-slate-950/80 space-y-3.5">
            <p className="text-xs text-slate-400">
              SNSにアップした際にアプリ側で入る余白で絵がズレないよう、分割面の両端を削ります。
              <strong className="text-sky-300 font-medium"> 標準推奨: 12px (片側6px)</strong>
            </p>

            <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-slate-400 w-10">0 px</span>
                <input
                  id="seam-trim-slider"
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={seamTrimPx}
                  onChange={(e) => handleSeamTrimChange(parseInt(e.target.value, 10))}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <span className="text-xs font-mono text-slate-400 w-10 text-right">20 px</span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 mr-1">クイック設定:</span>
                {[
                  { px: 0, label: '0px (削りなし)' },
                  { px: 8, label: '8px' },
                  { px: 12, label: '12px (標準★)' },
                  { px: 16, label: '16px' },
                  { px: 20, label: '20px' },
                ].map((p) => (
                  <button
                    key={`preset-trim-${p.px}`}
                    id={`trim-preset-${p.px}-btn`}
                    type="button"
                    onClick={() => handleSeamTrimChange(p.px)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                      seamTrimPx === p.px
                        ? 'bg-sky-500 text-white font-bold border-sky-400 shadow-sm shadow-sky-500/30'
                        : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

