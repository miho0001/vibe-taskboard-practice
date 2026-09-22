# setup — 受講生ごとの練習環境を用意する仕組み

受講生が何人いても、**1人1環境**で同じ練習ができるようにするためのスクリプト置き場です。
受講生には「1行を実行するだけ」に見えるようにしてあります。

## ファイル

| ファイル | 役割 |
| --- | --- |
| `setup-student.sh` | 受講生ひとりぶんの環境をまとめて作る（何度実行してもよい） |
| `check.sh` | 環境と進み具合をまとめて確認する（講師用） |
| `issues/*.md` | 受講生の環境に入れる依頼（Issue）の原本 |

ガイド本体は `site/`（GitHub Pages で公開）にあります。

## 受講生がやること

これだけです。

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/naogify/vibe-taskboard-practice/main/setup/setup-student.sh)
```

Claude Code に「練習環境を作ってください」と頼み、この1行を渡す運用でも構いません。
**中身の説明は不要です。**

## スクリプトが作るもの

| もの | 内容 |
| --- | --- |
| リポジトリ | `<受講生>/vibe-taskboard-practice`（このリポジトリをテンプレートとして複製） |
| 依頼 | `issues/*.md` の内容で Issue を作成 |
| ボード | GitHub Project（カンバン表示・未着手 / 作業中 / 完了）に依頼を並べる |
| ブランチ保護 | `main` は PR 必須・自動チェック必須（レビュー承認は 0 件でよい） |
| 手元の環境 | `~/work/vibe-taskboard-practice` に取得し、`npm install` とテスト用ブラウザまで完了 |

> **レビュー承認を 0 件にしている理由**
> ひとりで練習するため、自分の PR を自分でマージできないと1周が終わりません。
> 実務のチームでは 1 件以上にしてください。

## 講師向けの操作

```bash
# 受講生の状況をまとめて見る
bash setup/check.sh alice bob carol

# 依頼の内容を差し替える（次に環境を作る受講生から反映される）
$EDITOR setup/issues/01-persist.md

# 名前を変えて2つ目の環境を作る（作り直したいとき）
REPO_NAME=vibe-taskboard-practice-2 bash setup/setup-student.sh
```

### デプロイプレビューも付ける場合

Cloudflare のトークンを渡して実行すると、受講生のリポジトリにシークレットが設定され、
`.github/workflows/preview.yml` が動くようになります（PR ごとにプレビュー URL がコメントされます）。

```bash
CLOUDFLARE_API_TOKEN=xxxxx \
CLOUDFLARE_ACCOUNT_ID=yyyyy \
bash <(curl -fsSL https://raw.githubusercontent.com/naogify/vibe-taskboard-practice/main/setup/setup-student.sh)
```

トークンは Cloudflare ダッシュボード → My Profile → API Tokens → **Cloudflare Pages: Edit** の権限で作成します。
渡さない場合、プレビューは動きませんが練習は最後まで進められます（手元の `npm run dev` で確認できます）。

## 環境変数

| 変数 | 既定値 | 用途 |
| --- | --- | --- |
| `TEMPLATE_REPO` | `naogify/vibe-taskboard-practice` | 複製元 |
| `REPO_NAME` | `vibe-taskboard-practice` | 作るリポジトリ名 |
| `WORK_DIR` | `~/work` | 手元の置き場所 |
| `PROJECT_TITLE` | `タスクボード改修` | ボードの名前 |
| `PUBLIC_BOARD` | `true` | ボードを公開する（講師が見られるように） |
| `CHECK_NAME` | `型チェックとテスト` | 必須にする自動チェックの名前 |
