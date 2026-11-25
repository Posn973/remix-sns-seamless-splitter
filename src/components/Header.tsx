import React from 'react';
import { Scissors, HelpCircle, RefreshCw, Settings } from 'lucide-react';
import { AppStep } from '../types';
import { PWAInstallHeaderButton } from './PWAStatusBanner';

interface HeaderProps {
  currentStep: AppStep;
  hasImage: boolean;
  onOpenGuide: () => void;
  onOpenSettings?: () => void;
  onResetImage?: () => void;
  hideImageChangeBtn?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  hasImage,
  onOpenGuide,
  onOpenSettings,
  onResetImage,
  hideImageChangeBtn = false,
}) => {
  return (
    <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Logo and Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Scissors className="w-5 h-5 text-sky-400 -rotate-45" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                SNS Photo Splitter
              </h1>
              <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                後継モデル
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              操作性特化 • ステップ別分割・精密スライダー調整
            </p>
          </div>
        </div>

        {/* Center: Step indicators for desktop / tablet */}
        {hasImage && currentStep !== 'upload' && (
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                currentStep === 'setup'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-500'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">
                1
              </span>
              <span>分割設定</span>
            </span>

            <span className="text-slate-600 font-bold">&rarr;</span>

            <span
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                currentStep === 'edit'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-500'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">
                2
              </span>
              <span>編集</span>
            </span>

            <span className="text-slate-600 font-bold">&rarr;</span>

            <span
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                currentStep === 'preview'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-500'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">
                3
              </span>
              <span>確認・保存</span>
            </span>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* PWA Install / Status Button */}
          <PWAInstallHeaderButton />

          {/* Always-on Red Image Change Button (Hidden only in Edit and Fullscreen view) */}
          {hasImage && onResetImage && !hideImageChangeBtn && (
            <button
              id="header-change-image-btn"
              type="button"
              onClick={onResetImage}
              className="px-3.5 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:from-rose-700 active:to-red-700 border border-rose-400/40 rounded-xl shadow-lg shadow-rose-950/50 transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
              title="別の写真を選択する"
            >
              <RefreshCw className="w-4 h-4 text-rose-100 shrink-0" />
              <span className="font-bold whitespace-nowrap">画像変更</span>
            </button>
          )}

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              id="header-settings-btn"
              type="button"
              onClick={onOpenSettings}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 rounded-xl transition-all flex items-center gap-1.5"
              title="設定画面を開く"
            >
              <Settings className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">設定</span>
            </button>
          )}

          {/* Guide Button */}
          <button
            id="header-guide-btn"
            type="button"
            onClick={onOpenGuide}
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded-xl transition-all flex items-center gap-1.5"
            title="使い方と解説"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">使い方</span>
          </button>
        </div>
      </div>
    </header>
  );
};

