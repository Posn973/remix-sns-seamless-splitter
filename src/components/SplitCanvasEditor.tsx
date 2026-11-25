import React, { useRef, useState, useCallback, useEffect } from 'react';
import { SplitConfig, ImageMetadata } from '../types';
import { requestFullscreenAndLockPortrait, exitFullscreenAndUnlock } from '../utils/orientation';
import {
  MoveHorizontal,
  MoveVertical,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Sparkles,
  Maximize2,
  RotateCw,
  Check,
} from 'lucide-react';

interface SplitCanvasEditorProps {
  metadata: ImageMetadata;
  config: SplitConfig;
  onPositionChange: (index: number, newNormalizedPos: number) => void;
}

export const SplitCanvasEditor: React.FC<SplitCanvasEditorProps> = ({
  metadata,
  config,
  onPositionChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const modalStageRef = useRef<HTMLDivElement>(null);
  const modalBoxRef = useRef<HTMLDivElement>(null);

  const [activeDragIndex, setActiveDragIndex] = useState<number | null>(null);
  const [landscapeDragIndex, setLandscapeDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showExclusionZones, setShowExclusionZones] = useState<boolean>(true);
  const [isLandscapeModalOpen, setIsLandscapeModalOpen] = useState<boolean>(false);
  const [isRotated90, setIsRotated90] = useState<boolean>(true);

  // Exact rendered bounding box for the modal editor
  const [modalBoxSize, setModalBoxSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 400,
  });

  const isVertical = config.direction === 'vertical';
  const { positions, seamTrimPx } = config;

  // Accurately compute modal dimensions for both PC browsers (wide screens) and mobile devices
  const updateModalDimensions = useCallback(() => {
    if (!modalStageRef.current) return;
    const stageRect = modalStageRef.current.getBoundingClientRect();
    const stageW = Math.max(200, stageRect.width - 32);
    const stageH = Math.max(200, stageRect.height - 32);

    const imgAspect = metadata.width / metadata.height;

    let computedW = 0;
    let computedH = 0;

    if (isRotated90) {
      // In 90-degree rotated view:
      // The box has dimensions (width, height) in its local unrotated space,
      // but after CSS rotate(90deg), it occupies (height) horizontally and (width) vertically.
      // Therefore:
      // local width must fit inside stageH
      // local height must fit inside stageW
      const maxLocalW = stageH;
      const maxLocalH = stageW;

      if (maxLocalW / maxLocalH > imgAspect) {
        // Limited by height
        computedH = maxLocalH;
        computedW = maxLocalH * imgAspect;
      } else {
        // Limited by width
        computedW = maxLocalW;
        computedH = maxLocalW / imgAspect;
      }
    } else {
      // Normal unrotated view
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
    if (isLandscapeModalOpen) {
      updateModalDimensions();
      const timer = setTimeout(updateModalDimensions, 50);
      window.addEventListener('resize', updateModalDimensions);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateModalDimensions);
      };
    }
  }, [isLandscapeModalOpen, isRotated90, updateModalDimensions]);

  // Open modal handler with automatic 90-degree rotation enabled + direct orientation lock
  const handleOpenLandscapeModal = () => {
    requestFullscreenAndLockPortrait();
    setIsRotated90(true);
    setIsLandscapeModalOpen(true);
  };

  const handleCloseLandscapeModal = () => {
    exitFullscreenAndUnlock();
    setIsLandscapeModalOpen(false);
  };

  // Standard pointer drag handlers (Main screen)
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveDragIndex(index);
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (activeDragIndex === null || !imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      let normalizedPos = 0;

      if (isVertical) {
        const clientX = e.clientX;
        normalizedPos = (clientX - rect.left) / rect.width;
      } else {
        const clientY = e.clientY;
        normalizedPos = (clientY - rect.top) / rect.height;
      }

      const minDistance = 0.05;
      const prevLimit = activeDragIndex === 0 ? minDistance : positions[activeDragIndex - 1] + minDistance;
      const nextLimit =
        activeDragIndex === positions.length - 1
          ? 1 - minDistance
          : positions[activeDragIndex + 1] - minDistance;

      const clamped = Math.max(prevLimit, Math.min(nextLimit, normalizedPos));
      onPositionChange(activeDragIndex, clamped);
    },
    [activeDragIndex, isVertical, positions, onPositionChange]
  );

  const handlePointerUp = () => {
    if (activeDragIndex !== null) {
      setActiveDragIndex(null);
    }
  };

  // Landscape modal pointer drag handlers (Modal screen)
  const handleLandscapePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLandscapeDragIndex(index);
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {
      // ignore
    }
  };

  const handleLandscapePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (landscapeDragIndex === null || !modalBoxRef.current) return;

      const rect = modalBoxRef.current.getBoundingClientRect();
      let normalizedPos = 0;

      if (isRotated90) {
        // When container is rotated 90deg clockwise:
        // Original local X-axis (left->right) maps to screen Y-axis (top->bottom)
        // Original local Y-axis (top->bottom) maps to screen X-axis (right->left)
        if (isVertical) {
          normalizedPos = (e.clientY - rect.top) / rect.height;
        } else {
          normalizedPos = (rect.right - e.clientX) / rect.width;
        }
      } else {
        if (isVertical) {
          normalizedPos = (e.clientX - rect.left) / rect.width;
        } else {
          normalizedPos = (e.clientY - rect.top) / rect.height;
        }
      }

      const minDistance = 0.05;
      const prevLimit = landscapeDragIndex === 0 ? minDistance : positions[landscapeDragIndex - 1] + minDistance;
      const nextLimit =
        landscapeDragIndex === positions.length - 1
          ? 1 - minDistance
          : positions[landscapeDragIndex + 1] - minDistance;

      const clamped = Math.max(prevLimit, Math.min(nextLimit, normalizedPos));
      onPositionChange(landscapeDragIndex, clamped);
    },
    [landscapeDragIndex, isRotated90, isVertical, positions, onPositionChange]
  );

  const handleLandscapePointerUp = () => {
    if (landscapeDragIndex !== null) {
      setLandscapeDragIndex(null);
    }
  };

  // Compute slice regions for region labels
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

  const totalDimension = isVertical ? metadata.width : metadata.height;
  const halfGapPct = ((seamTrimPx / 2) / totalDimension) * 100;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Editor Top Bar */}
      <div className="px-3 sm:px-4 py-2.5 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white flex items-center gap-1.5">
            {isVertical ? <MoveHorizontal className="w-4 h-4 text-sky-400" /> : <MoveVertical className="w-4 h-4 text-sky-400" />}
            インタラクティブ編集キャンバス
          </span>
          <span className="text-slate-400 hidden md:inline">
            （線上のハンドルをドラッグして顔や文字を避けてください）
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Prominent Large Screen Edit Button */}
          <button
            id="open-landscape-modal-btn"
            type="button"
            onClick={handleOpenLandscapeModal}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
            title="画面全体を大きく使って分割位置を編集"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>大画面編集</span>
          </button>

          {/* Toggle Exclusion Zone Highlight */}
          <button
            id="toggle-exclusion-btn"
            type="button"
            onClick={() => setShowExclusionZones(!showExclusionZones)}
            className={`px-2.5 py-1.5 rounded-md border text-[11px] font-medium hidden sm:flex items-center gap-1 transition-colors ${
              showExclusionZones
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="削られる12pxの領域を表示/非表示"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>削り領域 ({seamTrimPx}px)</span>
          </button>

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              id="zoom-out-btn"
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
              title="縮小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              id="zoom-in-btn"
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.2))}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
              title="拡大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1 && (
              <button
                id="zoom-reset-btn"
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 ml-0.5"
                title="100%に戻す"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full bg-slate-950 p-4 sm:p-8 flex items-center justify-center overflow-auto min-h-[360px] max-h-[600px] select-none cursor-default"
        style={{ touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div
          className="relative inline-block shadow-2xl transition-transform duration-75 origin-center rounded-lg overflow-hidden border border-slate-700/60"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Source Image */}
          <img
            ref={imageRef}
            src={metadata.url}
            alt="Source"
            className="max-h-[480px] w-auto max-w-full block object-contain pointer-events-none"
            draggable={false}
          />

          {/* Slices Overlay Numbers */}
          <div className="absolute inset-0 pointer-events-none">
            {sliceBounds.map((slice) => {
              if (isVertical) {
                return (
                  <div
                    key={`slice-tag-${slice.index}`}
                    className="absolute top-3 transform -translate-x-1/2 pointer-events-none"
                    style={{ left: `${slice.center * 100}%` }}
                  >
                    <div className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-sm border border-sky-500/40 text-sky-300 font-bold text-[11px] sm:text-xs shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      <span>{slice.index + 1}枚目</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    key={`slice-tag-${slice.index}`}
                    className="absolute left-3 transform -translate-y-1/2 pointer-events-none"
                    style={{ top: `${slice.center * 100}%` }}
                  >
                    <div className="px-2.5 py-1 rounded-full bg-slate-900/85 backdrop-blur-sm border border-sky-500/40 text-sky-300 font-bold text-[11px] sm:text-xs shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      <span>{slice.index + 1}枚目</span>
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {/* Interactive Split Cut Lines */}
          {positions.map((pos, idx) => {
            const isDragging = activeDragIndex === idx;
            const isHovered = hoverIndex === idx;
            const pct = pos * 100;

            if (isVertical) {
              return (
                <div key={`cutline-v-${idx}`}>
                  {/* Exclusion Zone (12px seam trim visual feedback) */}
                  {showExclusionZones && seamTrimPx > 0 && (
                    <div
                      className="absolute top-0 bottom-0 pointer-events-none bg-red-500/25 border-x border-red-400/40 backdrop-blur-[0.5px]"
                      style={{
                        left: `calc(${pct}% - ${halfGapPct}%)`,
                        width: `${halfGapPct * 2}%`,
                      }}
                      title={`削り領域: 計${seamTrimPx}px`}
                    />
                  )}

                  {/* Center Cut Line */}
                  <div
                    className={`absolute top-0 bottom-0 transform -translate-x-1/2 z-20 cursor-ew-resize group ${
                      isDragging ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                    }`}
                    style={{ left: `${pct}%`, width: '36px' }}
                    onPointerDown={(e) => handlePointerDown(idx, e)}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    {/* Line visual */}
                    <div
                      className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 transition-all ${
                        isDragging
                          ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)] w-1'
                          : isHovered
                          ? 'bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)] w-1'
                          : 'bg-amber-400/90 shadow-md'
                      }`}
                    />

                    {/* Top Handle Knob */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-slate-950">
                      <MoveHorizontal className="w-3.5 h-3.5 text-slate-950" />
                    </div>

                    {/* Bottom Handle Knob */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-slate-950">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    </div>
                  </div>
                </div>
              );
            } else {
              return (
                <div key={`cutline-h-${idx}`}>
                  {/* Exclusion Zone */}
                  {showExclusionZones && seamTrimPx > 0 && (
                    <div
                      className="absolute left-0 right-0 pointer-events-none bg-red-500/25 border-y border-red-400/40 backdrop-blur-[0.5px]"
                      style={{
                        top: `calc(${pct}% - ${halfGapPct}%)`,
                        height: `${halfGapPct * 2}%`,
                      }}
                      title={`削り領域: 計${seamTrimPx}px`}
                    />
                  )}

                  {/* Center Cut Line */}
                  <div
                    className={`absolute left-0 right-0 transform -translate-y-1/2 z-20 cursor-ns-resize group ${
                      isDragging ? 'opacity-100' : 'opacity-90 hover:opacity-100'
                    }`}
                    style={{ top: `${pct}%`, height: '36px' }}
                    onPointerDown={(e) => handlePointerDown(idx, e)}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    {/* Line visual */}
                    <div
                      className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 transition-all ${
                        isDragging
                          ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)] h-1'
                          : isHovered
                          ? 'bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.8)] h-1'
                          : 'bg-amber-400/90 shadow-md'
                      }`}
                    />

                    {/* Left Handle Knob */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-slate-950">
                      <MoveVertical className="w-3.5 h-3.5 text-slate-950" />
                    </div>

                    {/* Right Handle Knob */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-slate-950">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Editor Footer Hint & Prominent Fullscreen Action Button */}
      <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>黄色の線：分割位置</span>
          <span className="w-2 h-2 rounded-full bg-red-400/80 ml-2" />
          <span>赤色の帯：SNS隙間相殺トリミング ({seamTrimPx}px)</span>
        </div>
        <button
          id="open-landscape-modal-bottom-btn"
          type="button"
          onClick={handleOpenLandscapeModal}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white border border-indigo-500/40 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 ml-auto"
          title="全画面大画面で分割線をドラッグして調整"
        >
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>全画面で編集する（大画面編集）</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* LANDSCAPE / FULLSCREEN MODAL FOR SMARTPHONE OR PC LARGE EDITING           */}
      {/* ========================================================================= */}
      {isLandscapeModalOpen && (
        <div
          id="landscape-editor-modal"
          className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-2 select-none animate-in fade-in duration-200"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl mb-1.5 flex-shrink-0 z-30 shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-indigo-600/40 text-indigo-300">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                  大画面 編集モード
                </h3>
                <p className="text-[10px] text-amber-400 font-medium leading-tight">
                  黄色のバーやつまみをスライドして分割位置を調整
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Rotate toggle */}
              <button
                id="toggle-rotation-btn"
                type="button"
                onClick={() => {
                  requestFullscreenAndLockPortrait();
                  setIsRotated90((prev) => !prev);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                  isRotated90
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="90°回転 / 通常向き 切り替え"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isRotated90 ? '90°回転中' : '通常向き'}</span>
              </button>

              {/* Done button */}
              <button
                id="close-landscape-modal-btn"
                type="button"
                onClick={handleCloseLandscapeModal}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-600/40"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>編集完了</span>
              </button>
            </div>
          </div>

          {/* Modal Fullscreen Interactive Area */}
          <div
            ref={modalStageRef}
            className="flex-1 min-h-0 relative flex items-center justify-center bg-black/95 rounded-xl border border-slate-800 overflow-hidden"
            style={{ touchAction: 'none' }}
            onPointerMove={handleLandscapePointerMove}
            onPointerUp={handleLandscapePointerUp}
          >
            {/*
              Modal Box: 
              Using explicitly computed pixel width & height to ensure cross-browser/PC/Mobile rendering compatibility.
            */}
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
              {/* Background Image inside modal */}
              <img
                src={metadata.url}
                alt="Source Fullscreen"
                className="w-full h-full object-fill pointer-events-none rounded-md border border-slate-700/80 shadow-2xl block"
                draggable={false}
              />

              {/* Slices Tag Overlays (Always on top of image) */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {sliceBounds.map((slice) => (
                  <div
                    key={`modal-slice-tag-${slice.index}`}
                    className={`absolute transform pointer-events-none ${
                      isVertical
                        ? 'top-2 -translate-x-1/2'
                        : 'left-2 -translate-y-1/2'
                    }`}
                    style={
                      isVertical
                        ? { left: `${slice.center * 100}%` }
                        : { top: `${slice.center * 100}%` }
                    }
                  >
                    <div className="px-2 py-0.5 rounded-full bg-slate-900/90 backdrop-blur-sm border border-sky-500/60 text-sky-300 font-bold text-[10px] sm:text-xs shadow-lg flex items-center gap-1">
                      <span>{slice.index + 1}枚目</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Cut Lines: Placed in image percentage coordinates */}
              {positions.map((pos, idx) => {
                const isDragging = landscapeDragIndex === idx;
                const pct = pos * 100;

                if (isVertical) {
                  return (
                    <div key={`modal-cutline-v-${idx}`}>
                      {/* Seam Trim Zone */}
                      {showExclusionZones && seamTrimPx > 0 && (
                        <div
                          className="absolute top-0 bottom-0 pointer-events-none bg-red-500/35 border-x border-red-400/60 z-20"
                          style={{
                            left: `calc(${pct}% - ${halfGapPct}%)`,
                            width: `${halfGapPct * 2}%`,
                          }}
                        />
                      )}

                      {/* Interactive Drag Handle Overlay */}
                      <div
                        className="absolute top-0 bottom-0 -translate-x-1/2 z-30 cursor-ew-resize flex items-center justify-center touch-none"
                        style={{ left: `${pct}%`, width: '56px' }}
                        onPointerDown={(e) => handleLandscapePointerDown(idx, e)}
                      >
                        {/* Golden Split Bar */}
                        <div
                          className={`h-full transition-all shadow-[0_0_14px_rgba(251,191,36,1)] ${
                            isDragging
                              ? 'bg-amber-300 w-2.5 shadow-[0_0_24px_rgba(251,191,36,1)]'
                              : 'bg-amber-400 w-1.5'
                          }`}
                        />

                        {/* Top Knob */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-2xl flex items-center justify-center text-slate-950">
                          <MoveHorizontal className="w-4 h-4 text-slate-950" />
                        </div>

                        {/* Center Knob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-amber-400 border-2 border-white shadow-2xl flex items-center justify-center text-slate-950">
                          <MoveHorizontal className="w-3.5 h-3.5 text-slate-950" />
                        </div>

                        {/* Bottom Knob */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-2xl flex items-center justify-center text-slate-950">
                          <MoveHorizontal className="w-4 h-4 text-slate-950" />
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={`modal-cutline-h-${idx}`}>
                      {/* Seam Trim Zone */}
                      {showExclusionZones && seamTrimPx > 0 && (
                        <div
                          className="absolute left-0 right-0 pointer-events-none bg-red-500/35 border-y border-red-400/60 z-20"
                          style={{
                            top: `calc(${pct}% - ${halfGapPct}%)`,
                            height: `${halfGapPct * 2}%`,
                          }}
                        />
                      )}

                      {/* Interactive Drag Handle Overlay */}
                      <div
                        className="absolute left-0 right-0 -translate-y-1/2 z-30 cursor-ns-resize flex items-center justify-center touch-none"
                        style={{ top: `${pct}%`, height: '56px' }}
                        onPointerDown={(e) => handleLandscapePointerDown(idx, e)}
                      >
                        {/* Golden Split Bar */}
                        <div
                          className={`w-full transition-all shadow-[0_0_14px_rgba(251,191,36,1)] ${
                            isDragging
                              ? 'bg-amber-300 h-2.5 shadow-[0_0_24px_rgba(251,191,36,1)]'
                              : 'bg-amber-400 h-1.5'
                          }`}
                        />

                        {/* Left Knob */}
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-2xl flex items-center justify-center text-slate-950">
                          <MoveVertical className="w-4 h-4 text-slate-950" />
                        </div>

                        {/* Center Knob */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-amber-400 border-2 border-white shadow-2xl flex items-center justify-center text-slate-950">
                          <MoveVertical className="w-3.5 h-3.5 text-slate-950" />
                        </div>

                        {/* Right Knob */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-2xl flex items-center justify-center text-slate-950">
                          <MoveVertical className="w-4 h-4 text-slate-950" />
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>

            {/* Floating Done Button at bottom right */}
            <div className="absolute bottom-3 right-3 z-40">
              <button
                type="button"
                onClick={() => setIsLandscapeModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-full flex items-center gap-2 shadow-2xl shadow-emerald-900 border border-emerald-400/50 backdrop-blur-sm"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>編集完了（戻る）</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
