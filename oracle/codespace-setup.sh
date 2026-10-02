#!/usr/bin/env bash
# codespace-setup.sh — runs inside a GitHub Codespace at post-create (guarded
# call from .devcontainer/post-create.sh). Builds the oracle's repo-map, runs
# the self-test pins, and leaves EVIDENCE: oracle-evidence/boot-<ts>.json.
# If the codespace's default GITHUB_TOKEN allows, evidence is pushed to a
# dated branch so the outside world can read the boot receipt — this is how
# a codespace-bound git-agent proves it floated, without any interactive SSH.
set -u
cd "$(dirname "$0")/.."
TS=$(date -u +%Y%m%d-%H%M%S)
EV="oracle-evidence"
mkdir -p "$EV"

{
  echo "{"
  echo "  \"boot\": \"oracle-poc\","
  echo "  \"ts\": \"$(date -u +%FT%TZ)\","
  echo "  \"codespace\": \"${CODESPACE_NAME:-local}\","
  echo "  \"pins\": \"$(bash oracle/self-test.sh --quick 2>&1 | tail -1)\","
  echo "  \"map\": $(python3 oracle/oracle.py build 2>/dev/null || echo '{}')"
  echo "}"
} > "$EV/boot-$TS.json"

# full self-test output as the run log
bash oracle/self-test.sh > "$EV/selftest-$TS.log" 2>&1 || true

echo "[codespace-setup] evidence written: $EV/boot-$TS.json"

# Push evidence to a dated branch if we're in a codespace with a token.
if [ -n "${CODESPACE_NAME:-}" ] && [ -n "${GITHUB_TOKEN:-}" ] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git config user.name "stitcher-oracle" || true
  git config user.email "oracle@superinstance.local" || true
  git add "$EV" >/dev/null 2>&1 || true
  git commit -q -m "oracle evidence: codespace boot $TS (self-test + repo-map receipts)" || true
  if ! git push -q "https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY:-SuperInstance/quilt-codespace}.git" \
      "HEAD:refs/heads/oracle-evidence-$TS" 2>/dev/null; then
    echo "[codespace-setup] evidence push failed (token scope?) — evidence kept local"
  else
    echo "[codespace-setup] evidence pushed to branch oracle-evidence-$TS"
  fi
fi
