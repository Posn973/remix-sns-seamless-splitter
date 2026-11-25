import React, { useState, useEffect } from 'react';
import { X, Sparkles, Save, RotateCcw, Check, Info, Smartphone, RefreshCw } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeamTrimPx: number;
  onApplyTrim: (newTrimPx: number) => void;
}

const STORAGE_KEY = 'sns_splitter_seam_trim_px';
export const DEFAULT_SEAM_TRIM_PX = 12;

export function getSavedSeamTrimPx(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 40) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_SEAM_TRIM_PX;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentSeamTrimPx,
  onApplyTrim,
}) => {
  const [trimVal, setTrimVal] = useState<number>(currentSeamTrimPx);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const {
    isOnline,
    latestVersion,
    needRefresh,
    isCheckingUpdate,
    isUpdating,
    lastCheckMessage,
    cooldownRemaining,
    checkForUpdate,
    reloadToUpdate,
  } = usePWA();

  useEffect(() => {
    if (isOpen) {
      setTrimVal(currentSeamTrimPx);
      setSavedSuccess(false);
    }
  }, [isOpen, currentSeamTrimPx]);

  if (!isOpen) return null;

  const handleSaveToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, trimVal.toString());
      onApplyTrim(trimVal);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      alert('設定の保存に失敗しました。');
    }
  };

  const handleResetToDefault = () => {
    setTrimVal(DEFAULT_SEAM_TRIM_PX);
    onApplyTrim(DEFAULT_SEAM_TRIM_PX);
    try {
      localStorage.setItem(STORAGE_KEY, DEFAULT_SEAM_TRIM_PX.toString());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 text-slate-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">アプリ設定</h3>
              <p className="text-xs text-slate-400">隙間トリミング幅のカスタマイズと保存</p>
            </div>
          </div>

          <button
            id="settings-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Seam Trim Setting */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>分割線の間を削るピクセル幅（シームトリム）</span>
              <span className="text-sky-300 font-mono text-sm bg-sky-950/80 px-2.5 py-0.5 rounded-md border border-sky-500/30">
                {trimVal} px (片側 {trimVal / 2} px)
              </span>
            </label>
            <p className="text-[11px] text-slate-400">
              SNS（X/Instagram等）に投稿した際、アプリ仕様で画像間に生じる余白分をあらかじめ削ることで、画像の繋がりを自然に見せます。
            </p>
          </div>

          {/* Range Slider */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-slate-400 w-8">0px</span>
              <input
                id="settings-trim-slider"
                type="range"
                min={0}
                max={30}
                step={1}
                value={trimVal}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setTrimVal(v);
                  onApplyTrim(v);
                }}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <span className="text-xs font-mono text-slate-400 w-8 text-right">30px</span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">クイック選択:</span>
              {[
                { px: 0, label: '0px (削りなし)' },
                { px: 6, label: '6px' },
                { px: 12, label: '12px (標準★)' },
                { px: 16, label: '16px' },
                { px: 20, label: '20px' },
              ].map((p) => (
                <button
                  key={`settings-trim-${p.px}`}
                  type="button"
                  onClick={() => {
                    setTrimVal(p.px);
                    onApplyTrim(p.px);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    trimVal === p.px
                      ? 'bg-sky-500 text-white font-bold border-sky-400 shadow-sm shadow-sky-500/30'
                      : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-sky-950/30 border border-sky-500/20 rounded-xl flex items-start gap-2 text-xs text-slate-300">
            <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <span>
              「{trimVal}pxで保存」を押すと設定がブラウザに保存され、次回アプリ起動時にもこの値（{trimVal}px）が初期値として自動反映されます。
            </span>
          </div>

          {/* Compact Version Update Check Section */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">バージョン更新</span>
                {latestVersion?.version && (
                  <span className="text-[11px] font-mono text-slate-400">v{latestVersion.version}</span>
                )}
              </div>

              {/* Prominent '更新確認' button */}
              <button
                id="settings-check-update-btn"
                type="button"
                onClick={() => checkForUpdate(true)}
                disabled={isCheckingUpdate || !isOnline || cooldownRemaining > 0}
                className={`px-3.5 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 active:scale-95 ${
                  cooldownRemaining > 0
                    ? 'bg-slate-800/60 border-slate-700/50 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/60 shadow-sm shadow-indigo-600/20'
                } disabled:opacity-50`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>{isCheckingUpdate ? '確認中...' : '更新確認'}</span>
              </button>
            </div>

            {/* When a new version is detected, show a direct Update Now button */}
            {needRefresh ? (
              <div className="flex items-center justify-between gap-2 bg-indigo-950/60 border border-indigo-500/40 py-2 px-3 rounded-lg">
                <span className="text-xs font-semibold text-indigo-200">
                  {latestVersion?.version
                    ? `最新版 v${latestVersion.version} が利用可能です`
                    : '新しいバージョンが利用可能です'}
                </span>
                <button
                  id="settings-apply-update-btn"
                  type="button"
                  onClick={reloadToUpdate}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span>{isUpdating ? '更新中...' : '今すぐ更新'}</span>
                </button>
              </div>
            ) : (
              lastCheckMessage && (
                <div className="text-xs text-center font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 py-1.5 px-2.5 rounded-lg">
                  {lastCheckMessage}
                </div>
              )
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            id="settings-reset-default-btn"
            type="button"
            onClick={handleResetToDefault}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>デフォルトに戻す (12px)</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="settings-save-btn"
              type="button"
              onClick={handleSaveToStorage}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 ${
                savedSuccess
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-sky-500/25'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>{trimVal}px を保存しました！</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{trimVal}px で設定を保存</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
