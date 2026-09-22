---
name: practice-env
description: 練習環境（自分専用のリポジトリ・依頼・ボード）を用意する／確認する／作り直す。「練習環境を作って」「環境がおかしい」「進み具合を確認して」と言われたときに使う。
---

# practice-env

受講生ひとりぶんの練習環境をまとめて用意します。**受講生に手順を覚えさせないこと**が目的です。

## 環境を作る（初回）

```bash
bash setup/setup-student.sh
```

リポジトリの外から始める場合（まだ手元に何もない状態）:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/naogify/vibe-taskboard-practice/main/setup/setup-student.sh)
```

このスクリプトが自動でやること:

1. `git` / `gh` / `node` / `npm` が入っているか確認
2. GitHub にログイン（ボード作成用の権限も一緒に取得）
3. 受講生のアカウントに練習用リポジトリを複製
4. 依頼（Issue）3件を `setup/issues/*.md` から作成
5. ボード（未着手 / 作業中 / 完了）を作成し、依頼を並べる
6. `main` を保護（PR 必須・自動チェック必須・承認は0件でよい）
7. 手元にコピーして `npm install` とテスト用ブラウザの導入

**何度実行しても壊れません**（すでにあるものは作り直しません）。

## 実行後に受講生へ伝えること

- 自分のリポジトリの URL とボードの URL
- 「ボードで #1 のカードを『作業中』に動かしてください」
- 「`claude` を起動して『Issue #1 を読んで対応してください』と伝えてください」

**スクリプトの中身や仕組みは説明しないでください。** 受講生が覚える必要はありません。

## 環境を確認する

```bash
bash setup/check.sh            # 自分の環境
bash setup/check.sh alice bob  # 複数の受講生（講師用）
```

リポジトリ・依頼の数・ボード・PR と自動チェックの状態・main の保護をまとめて表示します。

## うまくいかないとき

| 症状 | 対処 |
| --- | --- |
| `gh: command not found` | 記事の「準備（おまじない）」をやり直す |
| ボードが作られない | `gh auth refresh -s project,read:project` を実行してから再実行 |
| リポジトリ作成に失敗する | 同名のリポジトリがすでにある。`REPO_NAME=別の名前 bash setup/setup-student.sh` |
| プレビュー URL が出ない | 講師が Cloudflare の設定をしていない（無くても練習は進められる） |
