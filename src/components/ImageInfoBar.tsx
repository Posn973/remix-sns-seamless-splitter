import React from 'react';
import { RatioAnalysis } from '../utils/aspectRatio';
import { ImageMetadata } from '../types';
import { Ratio, Maximize2, FileCheck, Compass } from 'lucide-react';

interface ImageInfoBarProps {
  metadata: ImageMetadata;
  ratioAnalysis: RatioAnalysis;
}

export const ImageInfoBar: React.FC<ImageInfoBarProps> = ({ metadata, ratioAnalysis }) => {
  const isLandscape = ratioAnalysis.orientation === 'landscape';

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Aspect Ratio Badge & Label */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 border border-indigo-500/30 flex items-center justify-center text-sky-400">
            <Ratio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">検出されたアスペクト比:</span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {ratioAnalysis.ratioString}
              </span>
              {ratioAnalysis.matchedStandard && (
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                  ({ratioAnalysis.matchedStandard.name})
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{ratioAnalysis.orientationLabel}</span>
              <span>•</span>
              <span className="font-mono">比率: {ratioAnalysis.exactRatio.toFixed(3)} : 1</span>
            </div>
          </div>
        </div>

        {/* Right: Resolution & File metadata */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">解像度:</span>
            <span className="font-mono font-semibold text-white">
              {metadata.width} × {metadata.height} px
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">分割方式:</span>
            <span className="font-semibold text-emerald-300">
              {isLandscape ? '左右分割 (2〜20枚)' : '左右分割 (2〜20枚)'}
            </span>
          </div>

          {metadata.fileSize && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-1.5 text-slate-400">
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>{(metadata.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
