#!/usr/bin/env bash
# fix-loop.sh — the expert-coder loop over the oracle's decomposition.
#
# Usage:
#   bash oracle/fix-loop.sh <task-id> <test-cmd> [--apply <patch-script>]
#
# The loop: claim the task on the board -> for each EDIT cell in
# DECOMPOSITION.md (or the oracle draft): apply, run <test-cmd>, receipt the
# outcome. On fail: note the WHY in the adjustments ledger, retry (max 3).
# On final success: receipt 'task.done'. Every commit is a quilt tick.
#
# --apply <patch-script>: executable that mutates the working tree. If
# omitted, the loop runs in --simulate mode against the bundled fixture
# (fixes a real doc-drift line in README.md) so the loop is provable
# end-to-end without any live coding model.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
O="python3 oracle/oracle.py"
TASK_ID="${1:?task id required}"
TEST_CMD="${2:?test command required, e.g. 'bash oracle/self-test.sh --quick'}"
PATCH="${3:-}"
MAX_TRIES=3

receipt() { $O receipt "$1" "$2" >/dev/null; }

# ── claim: write a lease row on the board (FREEZE convention) ────────────────
lease_until=$(date -u -d '+30 minutes' +%FT%H:%M 2>/dev/null || date -u +%FT%H:%M)
printf "| %s | claimed | stitcher-oracle | %s | fix-loop |\n" "$TASK_ID" "$lease_until" >> oracle/TASKS.md
receipt "task.claim" "{\"task\":\"$TASK_ID\",\"lease_until\":\"$lease_until\"}"
echo "[fix-loop] claimed $TASK_ID (lease until $lease_until)"

tries=0
pass=false
while [ "$tries" -lt "$MAX_TRIES" ]; do
  tries=$((tries+1))
  echo "[fix-loop] attempt $tries/$MAX_TRIES"
  if [ -n "$PATCH" ]; then
    bash "$PATCH"
  else
    # simulate mode: the bundled fixture patch (real, tiny, honest)
    bash oracle/fixture-patch.sh
  fi
  if bash -c "$TEST_CMD"; then
    pass=true
    receipt "fix.attempt" "{\"task\":\"$TASK_ID\",\"try\":$tries,\"result\":\"pass\"}"
    break
  fi
  why="attempt $tries failed; test-cmd exited non-zero"
  echo "[fix-loop] WHY-ADJUSTMENT: $why" >> oracle/ADJUSTMENTS.md
  receipt "fix.attempt" "{\"task\":\"$TASK_ID\",\"try\":$tries,\"result\":\"fail\",\"why\":\"$why\"}"
done

if [ "$pass" = true ]; then
  receipt "task.done" "{\"task\":\"$TASK_ID\",\"tries\":$tries}"
  # commit as a tick if this is a git repo with changes
  if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    git add -A >/dev/null 2>&1 || true
    git -c user.name="stitcher-oracle" -c user.email="oracle@superinstance.local" \
      commit -q -m "oracle fix-loop: $TASK_ID completed in $tries attempt(s)

Receipt chain: .quilt/oracle-receipts.jsonl (task.claim -> fix.attempt* ->
task.done). Adjustments ledger: oracle/ADJUSTMENTS.md records every WHY." \
      >/dev/null 2>&1 || echo "[fix-loop] commit skipped (nothing staged)"
  fi
  echo "[fix-loop] DONE: $TASK_ID pass after $tries attempt(s)"
  exit 0
fi
receipt "task.failed" "{\"task\":\"$TASK_ID\",\"tries\":$tries}"
echo "[fix-loop] FAILED: $TASK_ID after $tries attempts — see oracle/ADJUSTMENTS.md"
exit 1
