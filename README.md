# SNS Photo Splitter（Remix SNS Seamless Splitter）

SNS に複数枚の画像として投稿したとき、並べると 1 枚の写真につながって見えるように分割する Web アプリです。
画像はブラウザの中だけで処理され、サーバーには送信されません。

**公開ページ:** https://posn973.github.io/remix-sns-seamless-splitter/

## 主な機能

- 2〜20 枚の左右分割
- 3 ステップの操作（分割設定 → 編集 → 確認・保存）
- 分割線の位置を 5px 単位で微調整できる精密スライダー
- SNS で画像の間に入る隙間を補正する「隙間補正」（初期値 12px）
- SNS 投稿イメージのプレビュー
- ZIP でまとめて保存／ZIP なしで全枚数を一括保存
- PWA 対応（ホーム画面に追加してオフラインでも使用可能、更新の確認機能つき）

## 使い方

1. 公開ページを開き、画像を選ぶ（ドラッグ＆ドロップも可）
2. 分割枚数を選び、「編集」で分割位置を調整して「編集完了」
3. 「確認・保存」でプレビューを確認し、ZIP または一括で保存

## 自分の PC で動かす

必要なもの: [Node.js](https://nodejs.org/)（20 以上）

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

本番用のファイルを作る場合は `npm run build` を実行すると `dist/` に出力されます。

## 公開（GitHub Pages）

`main` ブランチに push すると、GitHub Actions（`.github/workflows/deploy.yml`）が自動でビルドして GitHub Pages に公開します。
`public/version.json` は公開のたびに自動で作り直されます。バージョン番号を上げるときは `package.json` の `version` を変更してください。

## 使用技術

React 19 / TypeScript / Vite / Tailwind CSS / vite-plugin-pwa / JSZip / lucide-react

## ライセンス

[MIT License](LICENSE)
