#!/usr/bin/env bash
# oracle-worker.sh — outside-in driver for the codespace-bound git-agent.
# Fork of the codespace-worker one-shot pattern, extended for the oracle:
#   --keep          do NOT delete the codespace after the job (iterate inside)
#   --watch REFS    watch mode: poll `git ls-remote` for refs (two-agent dial
#                   watching — kilobytes, no clone) and print state changes
# Usage:
#   bash driver/oracle-worker.sh create [branch]        # create + wait + boot probe
#   bash driver/oracle-worker.sh ssh "<command>"        # ssh exec (gh or codespaces ssh)
#   bash driver/oracle-worker.sh delete                 # force-delete (unless --keep)
#   bash driver/oracle-worker.sh watch <repo> <ref-glob> [--interval 30]
# Requires: gh CLI (codespace ops) — the REST-only path is documented in
# ORACLE.md and needs no gh.
set -euo pipefail
CS_NAME="oracle-poc-${USER:-agent}"
REPO="${REPO:-SuperInstance/quilt-codespace}"

gh_present() { command -v gh >/dev/null 2>&1; }

wait_ready() {
  for i in $(seq 1 60); do
    S=$(gh codespace list -R "$REPO" --json name,state -q \
        ".[] | select(.name==\"$CS_NAME\") | .state" 2>/dev/null || echo "")
    [ "$S" = "Shutdown" ] && gh codespace start "$CS_NAME" >/dev/null 2>&1 || true
    [ "$S" = "Available" ] && { echo "codespace $CS_NAME ready"; return 0; }
    sleep 5
  done
  echo "timeout waiting for $CS_NAME"; return 1
}

case "${1:-}" in
  create)
    BRANCH="${2:-main}"
    gh_present || { echo "gh CLI required for create (REST path in ORACLE.md)"; exit 2; }
    echo "[oracle-worker] creating $CS_NAME on $REPO@$BRANCH"
    gh codespace create -R "$REPO" -b "$BRANCH" -m basicLinux32gb -s "$CS_NAME" 2>/dev/null \
      || gh codespace create -R "$REPO" -b "$BRANCH" -s "$CS_NAME"
    wait_ready
    gh codespace ssh -c "$CS_NAME" -- "cd /workspaces/\$(basename $REPO) && bash oracle/codespace-setup.sh" \
      || echo "[oracle-worker] setup exec failed (post-create may have already run it)"
    ;;
  ssh)
    gh_present || { echo "gh CLI required"; exit 2; }
    gh codespace ssh -c "$CS_NAME" -- "${2:?command required}"
    ;;
  delete)
    gh_present || { echo "gh CLI required"; exit 2; }
    gh codespace delete -s "$CS_NAME" --force || true
    echo "[oracle-worker] deleted $CS_NAME"
    ;;
  watch)
    REPO="${2:?repo}"; GLOB="${3:?ref glob, e.g. refs/quilt/*}"; IV="${5:-30}"
    echo "[oracle-worker] watching $REPO $GLOB every ${IV}s (Ctrl-C to stop)"
    PREV=""
    while true; do
      CUR=$(git ls-remote "https://github.com/$REPO.git" "$GLOB" 2>/dev/null || echo "")
      if [ "$CUR" != "$PREV" ] && [ -n "$PREV" ]; then
        echo "[oracle-worker] $(date -u +%T) dial change:"
        diff <(echo "$PREV") <(echo "$CUR") | grep '^[<>]' || true
      fi
      PREV="$CUR"
      sleep "$IV"
    done
    ;;
  *)
    echo "usage: $0 {create [branch]|ssh <cmd>|delete|watch <repo> <ref-glob> [--interval N]}"
    exit 2
    ;;
esac
