import React from 'react';
import {
  Scissors,
  ArrowRight,
  Maximize2,
  Settings,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { SplitConfig, SplitCount, ImageMetadata } from '../types';
import { getDefaultSplitPositions } from '../utils/imageSplitter';
import { ImageInfoBar } from './ImageInfoBar';
import { RatioAnalysis } from '../utils/aspectRatio';

interface StepSetupProps {
  metadata: ImageMetadata;
  ratioAnalysis: RatioAnalysis;
  config: SplitConfig;
  hasEditedInStep3: boolean;
  onChangeConfig: (newConfig: SplitConfig) => void;
  onGoToEdit: () => void;
  onGoToPreview: () => void;
  onOpenSettings: () => void;
}

const SPLIT_COUNT_OPTIONS: { count: SplitCount; sub: string; badge?: string }[] = [
  { count: 2, sub: '2枚出力' },
  { count: 3, sub: '3枚出力', badge: '標準' },
  { count: 4, sub: '4枚出力' },
  { count: 5, sub: '5枚出力' },
  { count: 6, sub: '6枚出力' },
  { count: 7, sub: '7枚出力' },
  { count: 8, sub: '8枚出力' },
  { count: 9, sub: '9枚出力' },
  { count: 10, sub: '10枚出力' },
  { count: 11, sub: '11枚出力' },
  { count: 12, sub: '12枚出力' },
  { count: 13, sub: '13枚出力' },
  { count: 14, sub: '14枚出力' },
  { count: 15, sub: '15枚出力' },
  { count: 16, sub: '16枚出力' },
  { count: 17, sub: '17枚出力' },
  { count: 18, sub: '18枚出力' },
  { count: 19, sub: '19枚出力' },
  { count: 20, sub: '20枚出力' },
];

export const StepSetup: React.FC<StepSetupProps> = ({
  metadata,
  ratioAnalysis,
  config,
  hasEditedInStep3,
  onChangeConfig,
  onGoToEdit,
  onGoToPreview,
  onOpenSettings,
}) => {
  const { count, positions, seamTrimPx } = config;
  const isDenseSplit = count >= 6;

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

  // Compute slice regions for mini visualizer
  const sliceBounds = React.useMemo(() => {
    const sorted = [...positions].sort((a, b) => a - b);
    const cuts = [0, ...sorted, 1];
    const regions = [];
    for (let i = 0; i < cuts.length - 1; i++) {
      regions.push({
        index: i,
        start: cuts[i],
        end: cuts[i + 1],
        center: (cuts[i] + cuts[i + 1]) / 2,
      });
    }
    return regions;
  }, [positions]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200">
      {/* Aspect Ratio & Resolution Info Bar */}
      <ImageInfoBar metadata={metadata} ratioAnalysis={ratioAnalysis} />

      {/* Main Split Setup Card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Card Header with Step Title & Settings Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              Step 1 • 分割設定
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
              分割枚数を選択
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              分割枚数を選択後、「編集」ボタンで分割線の微調整を行ってください。（左右分割）
            </p>
          </div>

          <button
            id="setup-open-settings-btn"
            type="button"
            onClick={onOpenSettings}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2 shadow-sm"
          >
            <Settings className="w-4 h-4 text-sky-400" />
            <span>設定 (隙間補正: {seamTrimPx}px)</span>
          </button>
        </div>

        {/* Split Count Selector: 2 〜 20 */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-sky-400" />
              分割枚数の選択（左右分割）
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              {count}枚に分割 (分割線 {count - 1}本)
            </span>
          </label>

          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            {SPLIT_COUNT_OPTIONS.map((opt) => (
              <button
                key={opt.count}
                id={`split-count-${opt.count}-btn`}
                type="button"
                onClick={() => handleCountChange(opt.count)}
                className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 relative cursor-pointer ${
                  count === opt.count
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25 scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {opt.badge && (
                  <span className="absolute -top-1 right-1 text-[8px] px-1 py-0 rounded bg-amber-400 text-slate-950 font-extrabold leading-tight shadow">
                    {opt.badge}
                  </span>
                )}
                <span className="whitespace-nowrap">{opt.count}分割</span>
                <span className="text-[10px] opacity-75 font-normal whitespace-nowrap">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visual Preview Box in Step 2 */}
        <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-400" />
              現在の分割プレビュー ({count}分割 • 左右分割)
            </span>
            <span className="text-slate-400 text-[11px]">
              ※分割線の位置調整は「編集」ボタンから行えます
            </span>
          </div>

          <div className="relative w-full max-h-[280px] bg-black/60 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-3">
            <div className="relative inline-block max-h-[240px] shadow-lg rounded-lg overflow-hidden border border-slate-700/60">
              <img
                src={metadata.url}
                alt="Preview"
                className="max-h-[240px] w-auto max-w-full block object-contain select-none opacity-90"
              />

              {/* Cut Lines Overlay (Left-to-right unified) */}
              {positions.map((pos, idx) => {
                const pct = pos * 100;
                return (
                  <div
                    key={`preview-v-${idx}`}
                    className="absolute top-0 bottom-0 pointer-events-none transform -translate-x-1/2"
                    style={{ left: `${pct}%` }}
                  >
                    <div
                      className={`h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] ${
                        isDenseSplit ? 'w-px' : 'w-0.5'
                      }`}
                    />
                    {!isDenseSplit && (
                      <div className="absolute top-1 left-1/2 -translate-x-1/2 px-1 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-bold font-mono">
                        #{idx + 1}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Number tags */}
              <div className="absolute inset-0 pointer-events-none">
                {sliceBounds.map((slice) => (
                  <div
                    key={`tag-${slice.index}`}
                    className="absolute top-2 transform -translate-x-1/2 pointer-events-none"
                    style={{ left: `${slice.center * 100}%` }}
                  >
                    <div
                      className={`rounded-full bg-slate-900/90 border border-sky-500/50 text-sky-300 font-bold shadow-md ${
                        isDenseSplit
                          ? 'px-1 py-0 text-[8px] leading-tight'
                          : 'px-2 py-0.5 text-[10px]'
                      }`}
                    >
                      {isDenseSplit ? slice.index + 1 : `${slice.index + 1}枚目`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: 「編集」 (大画面編集から改名) and 「次へ」 (ステップ3経由で有効化) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80">
          {/* Edit Button (Step 3 Trigger) */}
          <button
            id="go-to-edit-btn"
            type="button"
            onClick={onGoToEdit}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Maximize2 className="w-5 h-5" />
            <span>編集（分割位置を微調整する）</span>
          </button>

          {/* Next Button (Active only after passing through Step 3 Edit) */}
          <div className="w-full sm:w-auto flex flex-col items-center sm:items-end gap-1.5">
            <button
              id="go-to-preview-btn"
              type="button"
              disabled={!hasEditedInStep3}
              onClick={onGoToPreview}
              className={`w-full sm:w-auto px-7 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-xl ${
                hasEditedInStep3
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed opacity-70'
              }`}
            >
              <span>次へ（確認・書き出しへ）</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {!hasEditedInStep3 && (
              <span className="text-[11px] text-amber-400/90 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>「編集」ボタンから分割位置を確認・決定すると次へ進めます</span>
              </span>
            )}
            {hasEditedInStep3 && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>編集完了済み。「次へ」を押して保存へ進めます</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
