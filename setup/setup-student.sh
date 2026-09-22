#!/usr/bin/env bash
#
# 受講生ひとりぶんの練習環境を、まとめて用意するスクリプト。
#
#   - 自分のアカウントに練習用リポジトリを作る（テンプレートから複製）
#   - 依頼（Issue）を3件入れる
#   - ボード（GitHub Project）を作って、3件を並べる
#   - main ブランチを保護する（PR 必須・自動チェック必須）
#   - 手元にコピーして、動かせる状態にする
#
# 使い方（受講生は Claude Code から実行してもらう想定）:
#   bash <(curl -fsSL https://raw.githubusercontent.com/naogify/vibe-taskboard-practice/main/setup/setup-student.sh)
#
# 環境変数で変えられるもの:
#   TEMPLATE_REPO  複製元（既定: naogify/vibe-taskboard-practice）
#   REPO_NAME      作るリポジトリ名（既定: vibe-taskboard-practice）
#   WORK_DIR       置き場所（既定: ~/work）
#   PROJECT_TITLE  ボードの名前（既定: タスクボード改修）
#   PUBLIC_BOARD   ボードを公開するか（既定: true。講師が見られるようにするため）
#
set -euo pipefail

TEMPLATE_REPO="${TEMPLATE_REPO:-naogify/vibe-taskboard-practice}"
REPO_NAME="${REPO_NAME:-vibe-taskboard-practice}"
WORK_DIR="${WORK_DIR:-$HOME/work}"
PROJECT_TITLE="${PROJECT_TITLE:-タスクボード改修}"
PUBLIC_BOARD="${PUBLIC_BOARD:-true}"
CHECK_NAME="${CHECK_NAME:-型チェックとテスト}"

STEP=0

# 進行状況を見せるための表示関数
say()  { printf '\n\033[1;34m▶ %s\033[0m\n' "$1"; }
step() { STEP=$((STEP + 1)); printf '\n\033[1;34m[%d/9] %s\033[0m\n' "$STEP" "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
skip() { printf '  \033[33m-\033[0m %s\n' "$1"; }
die()  { printf '\n\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# ---------------------------------------------------------------------------
step "必要な道具がそろっているか確認します"

for cmd in git gh node npm; do
  command -v "$cmd" >/dev/null 2>&1 || die "$cmd が入っていません。記事の「準備（おまじない）」をやり直してください。"
  ok "$cmd $( "$cmd" --version 2>/dev/null | head -1 | tr -d '\n' )"
done

# ---------------------------------------------------------------------------
step "GitHub とつながっているか確認します"

# 未ログインならログインさせる。ボード作成には project 権限も必要なので最初から要求する
if ! gh auth status >/dev/null 2>&1; then
  say "GitHub にログインします。ブラウザが開くので、表示されたコードを貼り付けてください。"
  gh auth login --hostname github.com --git-protocol ssh --web --scopes 'project,read:project'
else
  ok "ログイン済み"
  if ! gh auth status 2>&1 | grep -q "'project'"; then
    say "ボードを作るための権限を追加します。ブラウザが開くので、表示されたコードを貼り付けてください。"
    gh auth refresh --hostname github.com --scopes 'project,read:project'
  fi
  ok "ボード作成の権限あり"
fi

OWNER="$(gh api user --jq .login)"
FULL="$OWNER/$REPO_NAME"
ok "あなたのアカウント: $OWNER"

# ---------------------------------------------------------------------------
step "あなた専用の練習リポジトリを作ります"

if gh repo view "$FULL" >/dev/null 2>&1; then
  skip "$FULL はすでにあります（そのまま使います）"
else
  gh repo create "$FULL" --template "$TEMPLATE_REPO" --public \
    --description "バイブコーディング練習用（$OWNER さんの環境）" >/dev/null
  ok "$FULL を作成しました"

  # テンプレートからの複製は少し遅れて反映されるので、中身ができるまで待つ
  for _ in $(seq 1 30); do
    if gh api "repos/$FULL/commits?per_page=1" >/dev/null 2>&1; then break; fi
    sleep 2
  done
fi

# ---------------------------------------------------------------------------
step "手元にコピーします"

mkdir -p "$WORK_DIR"
LOCAL_DIR="$WORK_DIR/$REPO_NAME"

if [ -d "$LOCAL_DIR/.git" ]; then
  skip "$LOCAL_DIR はすでにあります（最新を取得します）"
  git -C "$LOCAL_DIR" pull --ff-only >/dev/null 2>&1 || true
else
  gh repo clone "$FULL" "$LOCAL_DIR" >/dev/null 2>&1
  ok "$LOCAL_DIR にコピーしました"
fi

# ---------------------------------------------------------------------------
step "依頼（Issue）を用意します"

EXISTING_ISSUES="$(gh issue list -R "$FULL" --state all --limit 100 --json number --jq 'length')"

if [ "$EXISTING_ISSUES" -gt 0 ]; then
  skip "すでに $EXISTING_ISSUES 件あるので作りません"
else
  for file in "$LOCAL_DIR"/setup/issues/*.md; do
    [ -f "$file" ] || continue
    title="$(awk -F': ' '/^title: /{print $2; exit}' "$file")"
    label="$(awk -F': ' '/^labels: /{print $2; exit}' "$file")"
    # 2つ目の --- 以降が本文
    body="$(awk 'c==2{print} /^---$/{c++}' "$file")"

    if ! gh issue create -R "$FULL" --title "$title" --body "$body" --label "$label" >/dev/null 2>&1; then
      # ラベルが無い場合はラベルなしで作る
      gh issue create -R "$FULL" --title "$title" --body "$body" >/dev/null
    fi
    ok "$title"
  done
fi

# ---------------------------------------------------------------------------
step "ボード（未着手 / 作業中 / 完了）を作ります"

OWNER_ID="$(gh api graphql -f query='{viewer{id}}' --jq .data.viewer.id)"
REPO_ID="$(gh api "repos/$FULL" --jq .node_id)"

# 同じ名前のボードがすでにあれば作り直さない
PROJECT_ID="$(gh api graphql -f query='
  query($login:String!){ user(login:$login){ projectsV2(first:50){ nodes{ id title } } } }' \
  -f login="$OWNER" --jq ".data.user.projectsV2.nodes[] | select(.title==\"$PROJECT_TITLE\") | .id" | head -1)"

if [ -n "$PROJECT_ID" ]; then
  skip "「$PROJECT_TITLE」はすでにあります（そのまま使います）"
else
  PROJECT_ID="$(gh api graphql -f query='
    mutation($owner:ID!,$title:String!,$repo:ID!){
      createProjectV2(input:{ownerId:$owner,title:$title,repositoryId:$repo}){ projectV2{ id } }
    }' -f owner="$OWNER_ID" -f title="$PROJECT_TITLE" -f repo="$REPO_ID" \
    --jq .data.createProjectV2.projectV2.id)"
  ok "ボードを作成しました"

  # 既定のビューは表形式なので、カンバン（ボード）を作って表形式を消す
  gh api graphql -f query='
    mutation($pid:ID!){ createProjectV2View(input:{projectId:$pid,name:"ボード",layout:BOARD_LAYOUT}){ projectV2View{ id } } }' \
    -f pid="$PROJECT_ID" >/dev/null
  DEFAULT_VIEW="$(gh api graphql -f query='
    query($pid:ID!){ node(id:$pid){ ... on ProjectV2 { views(first:10){ nodes{ id name } } } } }' \
    -f pid="$PROJECT_ID" --jq '.data.node.views.nodes[] | select(.name=="View 1") | .id' | head -1)"
  if [ -n "$DEFAULT_VIEW" ]; then
    gh api graphql -f query='mutation($vid:ID!){ deleteProjectV2View(input:{viewId:$vid}){ clientMutationId } }' \
      -f vid="$DEFAULT_VIEW" >/dev/null
  fi
  ok "カンバン表示にしました"
fi

# 状態の名前を日本語にする（英語のままだと未経験者には分かりにくい）
FIELD_ID="$(gh api graphql -f query='
  query($pid:ID!){ node(id:$pid){ ... on ProjectV2 {
    fields(first:20){ nodes{ ... on ProjectV2SingleSelectField { id name } } } } } }' \
  -f pid="$PROJECT_ID" --jq '.data.node.fields.nodes[] | select(.name=="Status") | .id' | head -1)"

if [ -n "$FIELD_ID" ]; then
  gh api graphql -f query='
    mutation($fid:ID!){
      updateProjectV2Field(input:{fieldId:$fid,singleSelectOptions:[
        {name:"未着手",color:GRAY,description:""},
        {name:"作業中",color:YELLOW,description:""},
        {name:"完了",color:GREEN,description:""}
      ]}){ projectV2Field { ... on ProjectV2SingleSelectField { id } } }
    }' -f fid="$FIELD_ID" >/dev/null
  ok "状態を「未着手 / 作業中 / 完了」にしました"
fi

# ボードを公開しておくと、講師が進み具合を確認できる
if [ "$PUBLIC_BOARD" = "true" ]; then
  gh api graphql -f query='
    mutation($pid:ID!){ updateProjectV2(input:{projectId:$pid,public:true}){ projectV2{ id } } }' \
    -f pid="$PROJECT_ID" >/dev/null 2>&1 || true
fi

# ---------------------------------------------------------------------------
step "依頼をボードに並べます"

TODO_ID="$(gh api graphql -f query='
  query($pid:ID!){ node(id:$pid){ ... on ProjectV2 {
    fields(first:20){ nodes{ ... on ProjectV2SingleSelectField { name options{ id name } } } } } } }' \
  -f pid="$PROJECT_ID" --jq '.data.node.fields.nodes[] | select(.name=="Status") | .options[] | select(.name=="未着手") | .id' | head -1)"

for number in $(gh issue list -R "$FULL" --state open --limit 100 --json number --jq '.[].number' | sort -n); do
  ISSUE_ID="$(gh api "repos/$FULL/issues/$number" --jq .node_id)"
  ITEM_ID="$(gh api graphql -f query='
    mutation($pid:ID!,$cid:ID!){ addProjectV2ItemById(input:{projectId:$pid,contentId:$cid}){ item{ id } } }' \
    -f pid="$PROJECT_ID" -f cid="$ISSUE_ID" --jq .data.addProjectV2ItemById.item.id)"

  if [ -n "$TODO_ID" ] && [ -n "$FIELD_ID" ]; then
    gh api graphql -f query='
      mutation($pid:ID!,$iid:ID!,$fid:ID!,$oid:String!){
        updateProjectV2ItemFieldValue(input:{projectId:$pid,itemId:$iid,fieldId:$fid,
          value:{singleSelectOptionId:$oid}}){ projectV2Item{ id } }
      }' -f pid="$PROJECT_ID" -f iid="$ITEM_ID" -f fid="$FIELD_ID" -f oid="$TODO_ID" >/dev/null
  fi
  ok "#$number をボードに追加"
done

# ---------------------------------------------------------------------------
step "main ブランチを保護します"

# ひとりで練習するので、レビュー承認は 0 件でよい（自動チェックは必須にする）
cat > /tmp/vibe-protection.json <<JSON
{
  "required_status_checks": { "strict": true, "contexts": ["$CHECK_NAME"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "dismiss_stale_reviews": true, "required_approving_review_count": 0 },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

if gh api -X PUT "repos/$FULL/branches/main/protection" --input /tmp/vibe-protection.json >/dev/null 2>&1; then
  ok "main への直接変更を禁止しました（PR 必須・自動チェック必須）"
else
  skip "保護の設定に失敗しました（あとで講師に相談してください）"
fi
rm -f /tmp/vibe-protection.json

# 講師が Cloudflare のトークンを渡している場合は、プレビュー配信も有効にする
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ] && [ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  gh secret set CLOUDFLARE_API_TOKEN  -R "$FULL" --body "$CLOUDFLARE_API_TOKEN"  >/dev/null
  gh secret set CLOUDFLARE_ACCOUNT_ID -R "$FULL" --body "$CLOUDFLARE_ACCOUNT_ID" >/dev/null
  gh variable set ENABLE_PREVIEW -R "$FULL" --body "true" >/dev/null
  ok "デプロイプレビューを有効にしました"
fi

# ---------------------------------------------------------------------------
step "アプリを動かせる状態にします（数分かかります）"

cd "$LOCAL_DIR"
if npm install --no-audit --no-fund >/dev/null 2>&1; then
  ok "必要な部品をそろえました"
else
  skip "部品の取得に失敗しました（あとで npm install をやり直してください）"
fi

if npx --yes playwright install chromium >/dev/null 2>&1; then
  ok "テスト用のブラウザを入れました"
else
  skip "テスト用ブラウザの導入は後回しにします"
fi

# ---------------------------------------------------------------------------
BOARD_URL="$(gh api graphql -f query='query($pid:ID!){ node(id:$pid){ ... on ProjectV2 { url } } }' \
  -f pid="$PROJECT_ID" --jq .data.node.url 2>/dev/null || echo '')"

printf '\n\033[1;32m%s\033[0m\n' "━━━━━━━━━━━━━━━━━━ 準備が終わりました ━━━━━━━━━━━━━━━━━━"

cat <<EOS

  あなたのリポジトリ : https://github.com/$FULL
  あなたのボード     : ${BOARD_URL:-（作成できませんでした）}
  手元の置き場所     : $LOCAL_DIR

  次にやること:

    1. ボードを開いて、#1 のカードを「作業中」に動かす
    2. 下のコマンドで AI を起動する

         cd $LOCAL_DIR
         claude

    3. AI にこう伝える

         Issue #1 を読んで対応してください。

EOS
