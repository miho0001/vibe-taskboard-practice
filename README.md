# vibe-taskboard

バイブコーディング（Claude Code を使った開発）の練習用リポジトリです。
「Issue を読む → 実装 → テスト → PR → レビュー → マージ」という案件と同じ流れを、
小さなタスクボードアプリで一周できるようになっています。

## ガイドを読む

未経験からこのリポジトリで1周できるようになるまでの手順書です。
ターミナルの使い方から、PR を出してレビューを頼むところまで、画面付きで書いてあります。

**[未経験から「案件に入れる」までのバイブコーディング入門](https://naogify.github.io/vibe-taskboard-practice/)**

## はじめる（受講生）

**自分専用の環境をこの1行で用意できます。** 中で何をしているかは覚えなくて大丈夫です。

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/naogify/vibe-taskboard-practice/main/setup/setup-student.sh)
```

自分のアカウントにリポジトリが複製され、依頼（Issue）3件とボードが用意され、
手元で動かせる状態になります。終わったら、表示された手順どおりに進めてください。

Claude Code から実行してもらう場合は、こう頼めば済みます。

```
練習環境を作ってください。
bash <(curl -fsSL https://raw.githubusercontent.com/naogify/vibe-taskboard-practice/main/setup/setup-student.sh)
```

## 受講生を受け入れる（講師）

| やること | コマンド |
| --- | --- |
| 受講生の環境を確認する | `bash setup/check.sh <GitHubユーザー名> ...` |
| 依頼の内容を変える | `setup/issues/*.md` を編集（次の受講生から反映） |
| プレビュー配信も付ける | `CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... bash setup/setup-student.sh` |

詳しくは [setup/README.md](./setup/README.md) を読んでください。

## 使っているもの

| 役割 | ツール |
| --- | --- |
| 画面 | React 19 + TypeScript |
| ビルド / 開発サーバー | Vite |
| ユニットテスト | Vitest + Testing Library |
| E2E テスト | Playwright |
| CI | GitHub Actions |

## セットアップ

```bash
# 1. 依存パッケージを入れる
npm install

# 2. E2E 用のブラウザを入れる（初回だけ）
npx playwright install chromium

# 3. 開発サーバーを起動する（http://localhost:5173）
npm run dev
```

## よく使うコマンド

| コマンド | 何をするか |
| --- | --- |
| `npm run dev` | 開発サーバーを起動する |
| `npm run typecheck` | TypeScript の型エラーを調べる |
| `npm test` | ユニットテストを1回だけ実行する |
| `npm run test:watch` | ファイルを保存するたびにテストを実行する |
| `npm run test:e2e` | 本物のブラウザで E2E テストを実行する |
| `npm run build` | 本番用にビルドする |

## ディレクトリ構成

```
src/
  App.tsx          画面本体（表示と入力の受け取りだけ）
  App.test.tsx     画面のテスト
  lib/
    tasks.ts       ドメインロジック（純粋な関数のみ）
    tasks.test.ts  ロジックのユニットテスト
e2e/
  taskboard.spec.ts  E2E テスト（Given/When/Then）
docs/
  spec.md          仕様書。振る舞いを変えたら必ず更新する
CLAUDE.md          Claude Code が毎回読むプロジェクトのルール
.claude/skills/    Claude Code に覚えさせた作業手順（例: create-pr）
```

## 開発の流れ

1. Issue を選ぶ（GitHub Project の Todo から）
2. Claude Code に Issue 番号を渡して実装してもらう
3. `npm run typecheck && npm test && npm run test:e2e` が全部緑になるまで直す
4. PR を作る（`/create-pr` スキルを使う）
5. CI が緑になり、デプロイプレビューで動作確認できたらレビュー依頼
6. 承認されたら Squash merge

詳しいルールは [CLAUDE.md](./CLAUDE.md) を読んでください。
