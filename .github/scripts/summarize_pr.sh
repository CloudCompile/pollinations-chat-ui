#!/usr/bin/env bash
# .github/scripts/summarize_pr.sh
# Simplified version: Pollinations plain-text summary
set -euo pipefail

CACHE_DIR=".github/pr-summary-cache"
mkdir -p "$CACHE_DIR"

POLLINATIONS_REFERRER="${POLLINATIONS_REFERRER:-prisimai.github.io}"
MAX_DIFF_BYTES="${MAX_DIFF_BYTES:-32768}"
MAX_ATTEMPTS=4
WAIT_SECONDS=20

# ---- Pull Request context ---------------------------------------------------
EVENT_FILE="${GITHUB_EVENT_PATH:-.github/event.json}"
REPO="${GITHUB_REPOSITORY:?missing GITHUB_REPOSITORY}"
API_BASE="https://api.github.com/repos/${REPO}"

PR_NUMBER=$(jq -r '.pull_request.number // empty' "$EVENT_FILE")
BASE_REF=$(jq -r '.pull_request.base.ref // "main"' "$EVENT_FILE")
[ -z "$PR_NUMBER" ] && { echo "No PR number found"; exit 1; }

git fetch origin "$BASE_REF" || true
git diff "origin/${BASE_REF}...HEAD" > /tmp/pr_diff.txt || true

ADDED=$(git diff --numstat "origin/${BASE_REF}...HEAD" | awk '{a+=$1} END{print a+0}')
REMOVED=$(git diff --numstat "origin/${BASE_REF}...HEAD" | awk '{a+=$2} END{print a+0}')
FILES=$(git diff --name-only "origin/${BASE_REF}...HEAD" | wc -l | tr -d ' ')
TOTAL=$((ADDED + REMOVED))
DIFF_HASH=$(sha256sum /tmp/pr_diff.txt | awk '{print $1}')
CACHE_JSON="${CACHE_DIR}/${DIFF_HASH}.json"
CACHE_SUMMARY="${CACHE_DIR}/${DIFF_HASH}.summary.txt"

# ---- Try cache --------------------------------------------------------------
if [ -f "$CACHE_JSON" ] && [ -f "$CACHE_SUMMARY" ]; then
  SUMMARY=$(cat "$CACHE_SUMMARY")
else
  # ---- Pollinations request (plain text summarisation) ----------------------
  DIFF=$(head -c "$MAX_DIFF_BYTES" /tmp/pr_diff.txt || true)
  [ -z "$DIFF" ] && DIFF="(empty diff)"

  REQUEST_BODY=$(jq -n --arg model "openai-reasoning" --arg diff "$DIFF" '{
    model: $model,
    reasoning_effort: "medium",
    messages: [
      {role:"system",content:"You are a senior developer who writes concise, professional summaries of pull request code diffs."},
      {role:"user",content:"Summarise the following code diff in 2–4 sentences, explaining what changed and why. Keep it technical but easy to understand.\n\n\($diff)"}
    ]
  }')

  ATTEMPT=1
  SUMMARY=""
  while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Pollinations attempt $ATTEMPT/$MAX_ATTEMPTS"
    RESP=$(curl -sS -X POST "https://text.pollinations.ai/openai?referrer=${POLLINATIONS_REFERRER}" \
      -H "Content-Type: application/json" -d "$REQUEST_BODY" || true)

    SUMMARY=$(echo "$RESP" | jq -r 'if (.choices) then (.choices[0].message.content // .choices[0].text // empty) else . end' 2>/dev/null || echo "")
    if [ -n "$SUMMARY" ]; then
      echo "$SUMMARY" > "$CACHE_SUMMARY"
      echo "{\"summary\":$(jq -Rs . <<<"$SUMMARY")}" > "$CACHE_JSON"
      break
    fi
    echo "Empty summary. Waiting ${WAIT_SECONDS}s…"
    sleep "$WAIT_SECONDS"
    ATTEMPT=$((ATTEMPT+1))
  done

  # Fallback if still empty
  if [ -z "$SUMMARY" ]; then
    SUMMARY="PR changes: ${TOTAL} lines across ${FILES} files. Added ${ADDED}, removed ${REMOVED}."
    echo "$SUMMARY" > "$CACHE_SUMMARY"
    echo "{\"summary\":$(jq -Rs . <<<"$SUMMARY")}" > "$CACHE_JSON"
  fi
fi

# ---- Simple label logic -----------------------------------------------------
SIZE="size: XS"
[ "$TOTAL" -ge 50 ] && SIZE="size: Small"
[ "$TOTAL" -ge 200 ] && SIZE="size: Medium"
[ "$TOTAL" -ge 500 ] && SIZE="size: Large"
[ "$TOTAL" -ge 2000 ] && SIZE="size: XL"

RISK="medium"
BREAK="false"
RISK_LABEL="risk: ${RISK}"
BREAK_LABEL="breaking-change"

# ---- Comment body -----------------------------------------------------------
read -r -d '' BODY <<EOF || true
🤖 PR Summary by Pollinations.AI  
*(referrer: ${POLLINATIONS_REFERRER})*

### Summary
${SUMMARY}

**Risk Level:** ${RISK}  
**Breaking Change:** ${BREAK}

### Diff Stats
- Files changed: ${FILES}
- Lines added: ${ADDED}
- Lines removed: ${REMOVED}
- Total lines changed: ${TOTAL}

---
_This comment updates automatically._
EOF

COMMENTS_URL="${API_BASE}/issues/${PR_NUMBER}/comments"
COMMENT_ID=$(curl -s -H "Authorization: token ${GITHUB_TOKEN}" "${COMMENTS_URL}" |
  jq -r '.[] | select(.user.login=="github-actions[bot]") | select(.body|test("🤖 PR Summary by Pollinations")) | .id' | head -n1)

if [ -n "$COMMENT_ID" ]; then
  curl -s -X PATCH -H "Authorization: token ${GITHUB_TOKEN}" \
    "${API_BASE}/issues/comments/${COMMENT_ID}" -d "$(jq -nc --arg body "$BODY" '{body:$body}')" >/dev/null
else
  curl -s -X POST -H "Authorization: token ${GITHUB_TOKEN}" \
    "${COMMENTS_URL}" -d "$(jq -nc --arg body "$BODY" '{body:$body}')" >/dev/null
fi

# ---- Apply labels -----------------------------------------------------------
LABELS=("$SIZE" "$RISK_LABEL")
[ "$BREAK" = "true" ] && LABELS+=("$BREAK_LABEL")
jq -n --argjson arr "$(printf '%s\n' "${LABELS[@]}" | jq -R . | jq -s .)" '{labels:$arr}' |
  curl -s -X POST -H "Authorization: token ${GITHUB_TOKEN}" \
    "${API_BASE}/issues/${PR_NUMBER}/labels" -d @- >/dev/null

echo "Done."
