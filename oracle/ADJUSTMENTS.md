# ADJUSTMENTS.md — the why-ledger (append-only)

Every mid-loop adjustment gets a WHY line here BEFORE the retry, per the
adjustment→cell discipline: never adjust silently; each why is a candidate
new cell; runs converge when this ledger's growth rate falls to zero while
the pins stay green.

- 2026-10-02 stitcher: T1 fixture originally edited a nonexistent "ports table";
  WHY: README has no ports table yet — amended the EDIT cell to APPEND an
  oracle section instead (structure adjustment recorded, then fixture-patch.sh
  rewritten to match). Candidate new cell: PREFLIGHT (verify the edit target
  exists before EDIT) — queued for oracle.py plan().
