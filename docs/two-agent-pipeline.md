# two-agent-pipeline.md — the iteration pipeline, PoC-scale (task 66-d)

**Status: design only — nothing here has been run live yet.** This is the
PoC-scale version of the directive's second half: two agents coordinating
through files in an iteration pipeline. It builds on what already exists in
this repo (oracle/oracle.py's receipt chain, TASKS.md lease board,
fix-loop.sh) and on `tools/repo-oracle.mjs` (the deterministic battery).

## The loop

1. **Oracle A decomposes.** A runs `repo-oracle.mjs ask <repo> "<issue>"`
   (+ `oracle.py plan` for cell-graph work) over the repo's own records and
   writes a decomposition to `pipeline/A-decomp-<n>.json` — the trail, not
   just the answer: which commits/files/receipts it consulted and why.
   It then marks a TASKS.md row `claimed` with a lease (existing board
   semantics) and appends a `task.claim` receipt to the chain.
2. **Agent B executes.** B polls (git pull or `git ls-remote refs/*` —
   kilobyte protocol, no clone needed for detection), takes the unleased
   decomposition, executes its cells (LOCATE→EDIT→TEST→RECEIPT) in its own
   tree, and commits as a tick: one commit per decomposition, message
   referencing `A-decomp-<n>`. On failure: WHY line to ADJUSTMENTS.md
   before retry (≤3), exactly as the single-agent fix-loop already does.
3. **B's diff becomes A's new evidence.** B pushes; A re-runs the battery
   against the new tip — the diff between the two battery runs IS the
   feedback signal (new commits, changed heat, moved ledger tips, laws
   still present). A verifies B's receipt against the chain (fail-closed),
   appends `task.verified` (or `task.rejected` + why), releases the lease,
   and decomposes the next increment from the new state. Iteration n+1's
   evidence literally contains iteration n's outcome.

## Why files (not a broker)

The coordination surface is the repo itself: decompositions, leases,
receipts, and verdicts are all versioned text. That makes the pipeline
replayable (git log IS the run history), auditable (the receipt chain
verifies custody), and survivable (a dead agent's leases expire; its
half-work is a valid historical state, never deleted). Two repos can also
pair by watching each other's `refs/*` via `ls-remote` — the DECOMPOSITION.md
sketch — which is the same protocol with a different transport.

## PoC-scale guardrails

- Free tier = one codespace at a time: A runs inside, B runs outside
  (driver/oracle-worker.sh is the outside-in leg); they share the single
  remote, not a second machine.
- Both agents are deterministic instruments (no model calls in the loop);
  the model wrap sits above the pipeline, invoking it, not living in it.
- Nothing in the loop pushes without a receipt, and nothing deletes —
  append-only, rewind-by-new-commit.
