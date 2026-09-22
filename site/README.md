# site — 受講生向けガイドの公開用ファイル

`main` に入ると GitHub Actions（`.github/workflows/pages.yml`）が
このディレクトリをそのまま GitHub Pages に配信します。

公開先: https://naogify.github.io/vibe-taskboard-practice/

| ファイル | 中身 |
| --- | --- |
| `index.html` | ガイド本体。ビルド不要の静的 HTML 1枚 |
| `assets/*.png` | 本文中のスクリーンショット（27枚） |

## 直すとき

`index.html` を直接編集してください。ビルド手順はありません。
画像を差し替える場合は `assets/` に同じ名前で置き換えます。

元は Claude の artifact として書いたものを、公開用に次の3点だけ変えてあります。

1. 画像を base64 埋め込みから `assets/*.png` に切り出した（1ファイル 7.6MB → HTML 31KB + 画像 5.0MB）
2. 読み込んでも見た目が変わらない highlight.js のバンドル（約930KB）を外した
   - このページには `.hljs-*` のテーマ CSS が無いため、色は元から付いていなかった
3. `<title>` を `<head>` に移し、`lang="ja"` と `description` を足した
