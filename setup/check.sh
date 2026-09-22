#!/usr/bin/env bash
#
# 受講生の環境と進み具合をまとめて確認するスクリプト（講師用）。
#
# 使い方:
#   bash setup/check.sh                      # 自分の環境を確認
#   bash setup/check.sh alice bob carol      # 複数の受講生をまとめて確認
#
# 見るもの: リポジトリ / 依頼の数 / ボード / PR の状態 / 自動チェックの結果
#
set -uo pipefail

REPO_NAME="${REPO_NAME:-vibe-taskboard-practice}"
PROJECT_TITLE="${PROJECT_TITLE:-タスクボード改修}"

users=("$@")
if [ ${#users[@]} -eq 0 ]; then
  users=("$(gh api user --jq .login)")
fi

for user in "${users[@]}"; do
  full="$user/$REPO_NAME"
  printf '\n\033[1;34m── %s ──\033[0m\n' "$user"

  if ! gh repo view "$full" >/dev/null 2>&1; then
    printf '  \033[31m✗ リポジトリがありません（%s）\033[0m\n' "$full"
    continue
  fi
  printf '  ✓ リポジトリ: https://github.com/%s\n' "$full"

  # 依頼（Issue）の状況
  open_issues="$(gh issue list -R "$full" --state open --limit 100 --json number --jq 'length')"
  closed_issues="$(gh issue list -R "$full" --state closed --limit 100 --json number --jq 'length')"
  printf '  ・依頼: 残り %s 件 / 完了 %s 件\n' "$open_issues" "$closed_issues"

  # ボード
  board="$(gh api graphql -f query='
    query($login:String!){ user(login:$login){ projectsV2(first:50){ nodes{ title url } } } }' \
    -f login="$user" --jq ".data.user.projectsV2.nodes[] | select(.title==\"$PROJECT_TITLE\") | .url" 2>/dev/null | head -1)"
  if [ -n "$board" ]; then
    printf '  ・ボード: %s\n' "$board"
  else
    printf '  \033[33m- ボードが見つかりません（非公開か未作成）\033[0m\n'
  fi

  # 提出（PR）と自動チェック
  prs="$(gh pr list -R "$full" --state all --limit 20 --json number,title,state,statusCheckRollup --jq \
    '.[] | "  ・PR #\(.number) \(.state)  \(.title)  [チェック: \((.statusCheckRollup // []) | map(.conclusion // "PENDING") | join(","))]"' 2>/dev/null)"
  if [ -n "$prs" ]; then
    printf '%s\n' "$prs"
  else
    printf '  ・提出（PR）: まだありません\n'
  fi

  # main が保護されているか
  if gh api "repos/$full/branches/main/protection" >/dev/null 2>&1; then
    printf '  ✓ main は保護済み\n'
  else
    printf '  \033[33m- main が保護されていません\033[0m\n'
  fi
done

printf '\n'
