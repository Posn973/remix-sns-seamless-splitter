import React from 'react';
import { X, CheckCircle2, ShieldAlert, Sparkles, Sliders, Layers, ArrowRight, ShieldCheck, Smartphone } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">SNS Photo Splitter の使い方と仕組み</h2>
              <p className="text-xs text-slate-400">きれいなSNS分割投稿を作成するためのポイント</p>
            </div>
          </div>
          <button
            id="close-guide-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed">
          {/* Section 1: The 12px Gutter Compensation */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-indigo-500/20">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-sky-400" />
              なぜ「12ピクセル（片側6px）」削るのか？
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-3">
              X(Twitter)やInstagramなどのSNSでは、画像を複数並べて投稿した際に、アプリ側で
              <strong className="text-sky-300 font-medium">「画像同士の隙間（ガター・黒線/白線）」</strong>
              が挿入されます。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-red-500/30">
                <div className="flex items-center gap-1.5 text-red-400 font-semibold text-xs mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  そのまま分割した場合（0px削り）
                </div>
                <p className="text-xs text-slate-400">
                  アプリ側の余白のせいで、被写体の輪郭や背景の線が余計に広がり、繋ぎ目で絵がダブったりズレて見えてしまいます。
                </p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  12px削った場合（本アプリの自動補正）
                </div>
                <p className="text-xs text-slate-400">
                  分割面の境界を<strong className="text-emerald-300">片側6px・計12px</strong>トリミングすることで、SNSの余白と相殺され、シームレスに1枚の絵として鑑賞できます！
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              ※ 本アプリでは 0px 〜 20px の間で自由にピクセル数を微調整可能です。
            </p>
          </div>

          {/* Section 2: Avoid Cutting Faces with Sliders */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              スライダーで顔や文字の分断を避ける
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mb-2">
              初期状態では均等（2分割なら50%、3分割なら33%ごと、20分割なら5%ごと）に割り振られますが、キャラクターの顔や重要な文字の上に線が被ってしまうことがあります。
            </p>
            <ul className="text-xs sm:text-sm text-slate-300 space-y-1.5 list-disc list-inside">
              <li>画像上の<span className="text-amber-300 font-medium">「オレンジ色の分割線ハンドル」</span>を直接ドラッグ、またはスライダーを動かして位置を調整できます。</li>
              <li>顔や目を避けて、背景や身体の余白部分に分割線をずらすことで、綺麗で見やすい分割画像に仕上がります。</li>
            </ul>
          </div>

          {/* Section 3: 2/3/4 Splits vs 10/15/20 Splits */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
            <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              2〜20分割（左右分割）の使い分け
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-lg">
                <span className="font-semibold text-sky-400 block mb-1">【2 / 3 / 4分割】</span>
                Xの通常4枚以下投稿（2枚並び・3枚・2×2グリッド）や、Instagramのシンプルなカルーセル投稿に最適。
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg">
                <span className="font-semibold text-sky-400 block mb-1">【5〜20分割】</span>
                Xの最大20枚投稿や超ワイドパノラマ・シームレスな多枚数カルーセルに対応した左右連続分割です。
              </div>
            </div>
          </div>

          {/* Section 4: Local Processing & Hash-Checked PWA Cache */}
          <div className="bg-slate-800/60 rounded-xl p-4 border border-emerald-500/20 space-y-2.5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100%端末内ローカル処理 &amp; ハッシュ照合型PWA（0秒起動）
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              本アプリは、写真の切り抜き・ZIP生成などのすべての処理が<strong>お使いの端末（ブラウザ）内だけで完結</strong>します。写真が外部サーバーへ送信されることは一切ありません。
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/60 space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Smartphone className="w-3.5 h-3.5" />
                <span>超軽量ハッシュ照合（SHA-256）の仕組み</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                端末の本体キャッシュにより、2回目以降はサーバー通信を待たずに<strong>0秒で即座に起動</strong>します。サーバーへのアクセス負荷を軽減するため、自動ハッシュ照合は<strong>24時間に1回</strong>行われ、差分がある時だけ更新するため、通信量もほぼゼロで常に快適に利用できます（設定画面から30秒間隔で手動確認も可能）。
              </p>
            </div>
          </div>

          {/* Section 5: Workflow */}
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider text-slate-400">
              基本の流れ
            </h4>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs">
              <div className="flex-1 bg-slate-800 p-2.5 rounded-lg text-center">
                1. 写真をドロップ (16:9 / 9:16)
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block self-center" />
              <div className="flex-1 bg-slate-800 p-2.5 rounded-lg text-center">
                2. 分割枚数 (2〜20) &amp; 線位置調整
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 hidden sm:block self-center" />
              <div className="flex-1 bg-slate-800 p-2.5 rounded-lg text-center">
                3. 12px削り確認 &amp; ZIP保存
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            id="guide-confirm-btn"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow transition-colors"
          >
            閉じて編集を始める
          </button>
        </div>
      </div>
    </div>
  );
};
