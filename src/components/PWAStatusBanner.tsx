import React, { useState } from 'react';
import { Download, RefreshCw, WifiOff, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const PWAStatusBanner: React.FC = () => {
  const {
    isOnline,
    needRefresh,
    isUpdating,
    latestVersion,
    reloadToUpdate,
    dismissUpdateNotice,
  } = usePWA();

  const [showIOSModal, setShowIOSModal] = useState(false);

  const handleUpdateClick = async () => {
    try {
      await reloadToUpdate();
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  return (
    <>
      {/* 1. New Version Available (Hash Mismatch) Banner */}
      {needRefresh && (
        <aside aria-label="更新通知" className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-sm z-50 sticky top-0 border-b border-indigo-400/30">
          <div className="flex items-center gap-2 min-w-0">
            <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin text-blue-200" />
            <div className="truncate">
              <span className="font-bold mr-1.5">最新版があります</span>
              <span className="text-xs text-blue-100 hidden sm:inline">
                {latestVersion?.version ? `(v${latestVersion.version} ハッシュ更新検知)` : '(ハッシュ照合による差分検知)'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleUpdateClick}
              disabled={isUpdating}
              className="bg-white text-blue-700 hover:bg-blue-50 active:scale-95 px-3 py-1 rounded-md text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              {isUpdating ? '更新中...' : '今すぐ更新'}
            </button>
            <button
              onClick={dismissUpdateNotice}
              aria-label="閉じる"
              className="text-blue-200 hover:text-white p-1 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* 2. Offline Mode Badge */}
      {!isOnline && (
        <aside aria-label="オフライン状態" className="bg-amber-600 text-amber-50 px-3 py-1 text-xs flex items-center justify-center gap-1.5 font-medium border-b border-amber-700/50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>オフライン動作中（端末内キャッシュを利用して写真分割できます）</span>
        </aside>
      )}

      {/* 3. iOS Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">iPhone / iPadへの追加</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-300 leading-relaxed">
              ホーム画面に追加すると、通信なしで瞬時に起動でき、全画面アプリとして快適にご利用いただけます。
            </p>

            <div className="mt-4 space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">1</span>
                <div>
                  Safari画面下部（iPadは右上）の <strong className="text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600"><Share className="w-3 h-3" /> 共有ボタン</strong> をタップします。
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">2</span>
                <div>
                  メニューをスクロールし、<strong className="text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600"><PlusSquare className="w-3 h-3" /> ホーム画面に追加</strong> を選択します。
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">3</span>
                <div>
                  右上の<strong>「追加」</strong>をタップして完了です。
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/20"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const PWAInstallHeaderButton: React.FC = () => {
  const { isInstalled, isInstallable, isIOS, installApp } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If running as standalone installed app, don't show install button
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-1 rounded-lg">
        <CheckCircle2 className="w-3 h-3" />
        <span>キャッシュ保存済</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        onClick={installApp}
        title="アプリを端末にインストールしてオフライン・高速起動を有効化"
        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">アプリ保存</span>
        <span className="sm:hidden">保存</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          title="iPhone/iPadのホーム画面に追加"
          className="flex items-center gap-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-600 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ホーム画面に追加</span>
          <span className="sm:hidden">追加</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-700 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base">iPhone / iPadへの追加</h3>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                ホーム画面に追加すると、通信なしで瞬時に起動でき、全画面アプリとして快適にご利用いただけます。
              </p>

              <div className="mt-4 space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">1</span>
                  <div>
                    Safari画面下部の <strong className="text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600"><Share className="w-3 h-3" /> 共有ボタン</strong> をタップします。
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">2</span>
                  <div>
                    メニューをスクロールし、<strong className="text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600"><PlusSquare className="w-3 h-3" /> ホーム画面に追加</strong> を選択します。
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">3</span>
                  <div>
                    右上の<strong>「追加」</strong>をタップして完了です。
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="mt-5 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/20"
              >
                閉じる
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
