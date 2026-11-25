import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  RotateCw,
  Check,
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { SplitConfig, ImageMetadata } from '../types';
import { getDefaultSplitPositions } from '../utils/imageSplitter';
import { requestFullscreenAndLockPortrait, exitFullscreenAndUnlock } from '../utils/orientation';

interface StepEditProps {
  metadata: ImageMetadata;
  config: SplitConfig;
  onChangeConfig: (newConfig: SplitConfig) => void;
  onFinishEdit: () => void;
}

export const StepEdit: React.FC<StepEditProps> = ({
  metadata,
  config,
  onChangeConfig,
  onFinishEdit,
}) => {
  const modalStageRef = useRef<HTMLDivElement>(null);
  const modalBoxRef = useRef<HTMLDivElement>(null);

  // States
  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isRotated90, setIsRotated90] = useState<boolean>(true);
  const [showExclusionZones, setShowExclusionZones] = useState<boolean>(true);

  // Precision slide mode states
  const [isPrecisionMode, setIsPrecisionMode] = useState<boolean>(false);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number>(0);

  // Exact rendered bounding box for the editor canvas
  const [modalBoxSize, setModalBoxSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 400,
  });

  const { positions, seamTrimPx, count } = config;
  const totalDimension = metadata.width;
  const halfGapPct = ((seamTrimPx / 2) / totalDimension) * 100;
  const isDenseSplit = count >= 6;
  const handleWidthPx = count >= 15 ? 24 : count >= 10 ? 32 : count >= 6 ? 40 : 56;

  // Keep selectedLineIndex valid if split count changes
  useEffect(() => {
    if (selectedLineIndex >= positions.length) {
      setSelectedLineIndex(0);
    }
  }, [positions.length, selectedLineIndex]);

  // Initialize orientation lock on mount
  useEffect(() => {
    requestFullscreenAndLockPortrait();
    return () => {
      exitFullscreenAndUnlock();
    };
  }, []);

  // Compute bounding box
  const updateModalDimensions = useCallback(() => {
    if (!modalStageRef.current) return;
    const stageRect = modalStageRef.current.getBoundingClientRect();
    const stageW = Math.max(200, stageRect.width - 24);
    const stageH = Math.max(200, stageRect.height - 24);

    const imgAspect = metadata.width / metadata.height;

    let computedW = 0;
    let computedH = 0;

    if (isRotated90) {
      const maxLocalW = stageH;
      const maxLocalH = stageW;

      if (maxLocalW / maxLocalH > imgAspect) {
        computedH = maxLocalH;
        computedW = maxLocalH * imgAspect;
      } else {
        computedW = maxLocalW;
        computedH = maxLocalW / imgAspect;
      }
    } else {
      if (stageW / stageH > imgAspect) {
        computedH = stageH;
        computedW = stageH * imgAspect;
      } else {
        computedW = stageW;
        computedH = stageW / imgAspect;
      }
    }

    setModalBoxSize({
      width: Math.round(computedW),
      height: Math.round(computedH),
    });
  }, [metadata.width, metadata.height, isRotated90]);

  useEffect(() => {
    updateModalDimensions();
    const timer1 = setTimeout(updateModalDimensions, 50);
    const timer2 = setTimeout(updateModalDimensions, 200);
    window.addEventListener('resize', updateModalDimensions);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', updateModalDimensions);
    };
  }, [isRotated90, isPrecisionMode, updateModalDimensions]);

  // Position change helper
  const handlePositionChange = useCallback(
    (index: number, newNormalizedPos: number) => {
      const newPositions = [...positions];
      const minDistance = Math.min(0.04, 0.35 / count);
      const prevLimit = index === 0 ? minDistance : newPositions[index - 1] + minDistance;
      const nextLimit =
        index === newPositions.length - 1 ? 1 - minDistance : newPositions[index + 1] - minDistance;

      newPositions[index] = Math.max(prevLimit, Math.min(nextLimit, newNormalizedPos));
      onChangeConfig({
        ...config,
        positions: newPositions,
      });
    },
    [positions, config, count, onChangeConfig]
  );

  // 5px step nudge for precision slide
  const handleNudgePixel = useCallback(
    (deltaPx: number) => {
      if (totalDimension <= 0 || selectedLineIndex >= positions.length) return;
      const deltaNormalized = deltaPx / totalDimension;
      const current = positions[selectedLineIndex];
      handlePositionChange(selectedLineIndex, current + deltaNormalized);
    },
    [totalDimension, selectedLineIndex, positions, handlePositionChange]
  );

  // Pointer drag events on canvas
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDragIndex(index);
    setSelectedLineIndex(index);
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (activeDragIndex === null || !modalBoxRef.current) return;

      const rect = modalBoxRef.current.getBoundingClientRect();
      const normalizedPos = isRotated90
        ? (e.clientY - rect.top) / rect.height
        : (e.clientX - rect.left) / rect.width;

      handlePositionChange(activeDragIndex, normalizedPos);
    },
    [activeDragIndex, isRotated90, handlePositionChange]
  );

  const handlePointerUp = () => {
    if (activeDragIndex !== null) {
      setActiveDragIndex(null);
    }
  };

  // Reset equal positions
  const handleResetEqual = () => {
    onChangeConfig({
      ...config,
      positions: getDefaultSplitPositions(count),
    });
  };

  // Slice region bounds
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
    <div
      id="step-edit-container"
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-2 sm:p-3 select-none animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-2xl mb-2 flex-shrink-0 z-30 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                編集（分割位置の微調整）
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {count}分割 ({positions.length}本の線)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight hidden xs:block">
              黄色の分割線をスライドして顔や文字を避けてください
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2">
          {/* Precision Slide Toggle Button */}
          <button
            id="toggle-precision-slide-btn"
            type="button"
            onClick={() => setIsPrecisionMode((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 shadow-md ${
              isPrecisionMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30 font-extrabold'
                : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-slate-700'
            }`}
            title="5pxごとのボタン微調整モード"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>精密スライド</span>
          </button>

          {/* 90° Rotation Toggle */}
          <button
            id="toggle-rotate-btn"
            type="button"
            onClick={() => {
              requestFullscreenAndLockPortrait();
              setIsRotated90((prev) => !prev);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 active:scale-95 shadow-md ${
              isRotated90
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-500/30'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
            }`}
            title="0°と90°の回転切り替え"
          >
            <RotateCw className={`w-3.5 h-3.5 transition-transform duration-200 ${isRotated90 ? 'rotate-90' : ''}`} />
            <span>{isRotated90 ? '90°回転中' : '通常向き'}</span>
          </button>

          {/* Edit Complete Button */}
          <button
            id="finish-edit-btn"
            type="button"
            onClick={onFinishEdit}
            className="px-4 py-1.5 sm:px-5 sm:py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>編集完了</span>
          </button>
        </div>
      </div>

      {/* Precision Slide Control Bar (Visible when Precision Slide is active) */}
      {isPrecisionMode && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-2 sm:p-3 mb-2 flex-shrink-0 z-30 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Focus line selector */}
            <div className="flex items-center gap-2 min-w-0 max-w-full">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                調整する線:
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
                {positions.map((_, idx) => (
                  <button
                    key={`line-select-${idx}`}
                    type="button"
                    onClick={() => setSelectedLineIndex(idx)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center flex-shrink-0 ${
                      selectedLineIndex === idx
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Step -5px / +5px Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-mono hidden sm:inline">
                現在: <strong className="text-amber-300">{Math.round(positions[selectedLineIndex] * totalDimension)}px</strong>
              </span>

              {/* Nudge Left/Up -5px */}
              <button
                id="precision-nudge-minus-5px"
                type="button"
                onClick={() => handleNudgePixel(-5)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white rounded-xl border border-slate-700 text-xs font-bold font-mono flex items-center gap-1 shadow-md active:scale-95"
                title="-5px 微調整"
              >
                <ChevronLeft className="w-4 h-4 text-amber-400" />
                <span>＜ -5px</span>
              </button>

              {/* Nudge Right/Down +5px */}
              <button
                id="precision-nudge-plus-5px"
                type="button"
                onClick={() => handleNudgePixel(5)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white rounded-xl border border-slate-700 text-xs font-bold font-mono flex items-center gap-1 shadow-md active:scale-95"
                title="+5px 微調整"
              >
                <span>+5px ＞</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>

              {/* Reset to equal */}
              <button
                id="precision-reset-equal-btn"
                type="button"
                onClick={handleResetEqual}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700"
                title="均等に戻す"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Interactive Canvas Stage */}
      <div
        ref={modalStageRef}
        className="flex-1 min-h-0 relative flex items-center justify-center bg-black/95 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl"
        style={{ touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Rendered Container Box */}
        <div
          ref={modalBoxRef}
          className="relative shadow-2xl transition-transform duration-150 select-none flex-shrink-0"
          style={{
            width: `${modalBoxSize.width}px`,
            height: `${modalBoxSize.height}px`,
            transform: isRotated90 ? 'rotate(90deg)' : 'none',
            transformOrigin: 'center center',
          }}
        >
          {/* Source Image */}
          <img
            src={metadata.url}
            alt="Edit Canvas"
            className="w-full h-full object-fill pointer-events-none rounded-lg border border-slate-700/80 shadow-2xl block"
            draggable={false}
          />

          {/* Slices Overlays */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {sliceBounds.map((slice) => (
              <div
                key={`edit-slice-tag-${slice.index}`}
                className="absolute top-2 transform -translate-x-1/2 pointer-events-none"
                style={{ left: `${slice.center * 100}%` }}
              >
                <div
                  className={`rounded-full bg-slate-900/90 backdrop-blur-sm border border-sky-500/60 text-sky-300 font-bold shadow-lg flex items-center gap-1 ${
                    isDenseSplit
                      ? 'px-1.5 py-0.5 text-[9px]'
                      : 'px-2 py-0.5 text-[10px] sm:text-xs'
                  }`}
                >
                  <span>{isDenseSplit ? slice.index + 1 : `${slice.index + 1}枚目`}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Split Cut Lines (Unified Left-Right Split) */}
          {positions.map((pos, idx) => {
            const isDragging = activeDragIndex === idx;
            const isSelected = isPrecisionMode && selectedLineIndex === idx;
            const pct = pos * 100;

            return (
              <div key={`edit-cutline-v-${idx}`}>
                {/* Seam Trim Zone (Red highlight) */}
                {showExclusionZones && seamTrimPx > 0 && (
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none bg-red-500/35 border-x border-red-400/60 z-20"
                    style={{
                      left: `calc(${pct}% - ${halfGapPct}%)`,
                      width: `${halfGapPct * 2}%`,
                    }}
                  />
                )}

                {/* Interactive Drag Handle */}
                <div
                  className="absolute top-0 bottom-0 -translate-x-1/2 z-30 cursor-ew-resize flex items-center justify-center touch-none group"
                  style={{ left: `${pct}%`, width: `${handleWidthPx}px` }}
                  onPointerDown={(e) => handlePointerDown(idx, e)}
                  onMouseEnter={() => setHoverIndex(idx)}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  {/* Line visual */}
                  <div
                    className={`h-full transition-all shadow-[0_0_14px_rgba(251,191,36,1)] ${
                      isDragging || isSelected
                        ? 'bg-amber-300 w-2 shadow-[0_0_24px_rgba(251,191,36,1)]'
                        : isDenseSplit
                        ? 'bg-amber-400 w-1'
                        : 'bg-amber-400 w-1.5'
                    }`}
                  />

                  {/* Top Knob with Line Number */}
                  <div
                    className={`absolute top-2 left-1/2 -translate-x-1/2 rounded-full border-2 border-white shadow-2xl flex items-center justify-center font-bold font-mono transition-transform ${
                      isDenseSplit ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'
                    } ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 scale-110 ring-4 ring-amber-400/50'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  {/* Center Knob */}
                  <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border-2 border-white shadow-2xl flex items-center justify-center text-slate-950 ${
                      isDenseSplit ? 'w-5 h-5' : 'w-7 h-7'
                    }`}
                  >
                    <MoveHorizontal className={isDenseSplit ? 'w-3 h-3 text-slate-950' : 'w-3.5 h-3.5 text-slate-950'} />
                  </div>

                  {/* Bottom Knob */}
                  <div
                    className={`absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 border-2 border-white shadow-2xl flex items-center justify-center text-slate-950 font-mono font-bold ${
                      isDenseSplit ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Bottom Right Quick Done Button */}
        <div className="absolute bottom-3 right-3 z-40">
          <button
            id="floating-finish-edit-btn"
            type="button"
            onClick={onFinishEdit}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-2xl shadow-emerald-950 border border-emerald-400/40 active:scale-95 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>編集完了（ステップ2へ戻る）</span>
          </button>
        </div>
      </div>
    </div>
  );
};
