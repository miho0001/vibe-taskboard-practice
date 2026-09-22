---
name: create-pr
description: 変更内容をブランチにコミットし、テストを通してから Pull Request を作成する。作業が一区切りついて「PRを作って」「レビューに出して」と言われたときに使う。
---

# create-pr

作業した変更を、レビューしてもらえる状態の Pull Request にするまでの手順です。
**この順番を飛ばさないこと。**

## 手順

### 1. 変更内容を確認する

```bash
git status
git diff
```

- 意図しないファイル（`.env`、`node_modules`、デバッグ用の `console.log`）が混ざっていないか確認する
- 混ざっていたら取り除く

### 2. テストを全部通す

```bash
npm run typecheck
npm test
npm run test:e2e
```

1つでも失敗したら、**PR は作らずに修正する**。落ちたテストを消して通すのは禁止。

### 3. ブランチを切る（まだの場合）

```bash
git switch -c feat/<Issue番号>-<内容の短い英語>
```

例: `feat/12-add-done-filter`

`main` にいる状態でコミットしてはいけない。

### 4. コミットする

```bash
git add <変更したファイル>
git commit -m "$(cat <<'EOF'
一覧に「完了」フィルタを追加

- filterTasks に done を追加
- ユニットテストと E2E テストを追加
EOF
)"
```

- コミットメッセージは日本語、1行目は 50 文字以内で「何をしたか」
- `git add .` ではなく、変更したファイルを明示的に指定する

### 5. push して PR を作る

```bash
git push -u origin HEAD
gh pr create --title "<日本語のタイトル>" --body "$(cat <<'EOF'
## 対応内容
- （何をしたか箇条書き）

## 関連 Issue
Closes #12

## テスト
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run test:e2e`

## レビュー時の確認ポイント
- （レビュアーに特に見てほしい箇所）

## 動作確認方法
1. デプロイプレビューの URL を開く
2. （手順）
EOF
)"
```

### 6. CI とプレビューを確認する

```bash
gh pr checks --watch
```

- CI が全部緑になるまで待つ
- 赤くなったら `gh run view --log-failed` でログを見て直す
- Vercel のデプロイプレビュー URL を開き、自分の目で動作を確認する

### 7. 完了報告

PR の URL・確認したこと・プレビュー URL をまとめて報告する。
CI が緑になっていない PR を「レビューお願いします」と出してはいけない。
