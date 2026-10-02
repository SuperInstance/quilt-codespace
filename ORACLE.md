# ORACLE.md — the callable git-agent, PoC (wave-66)

**The vision this PoC proves:** an internal *callable* git-agent that knows
this repo perfectly — as an oracle — and can also act as an expert coder,
because the logic is decomposed by it, for it. It runs inside a Codespace,
works from the outside (HTTP) or in its terminal (CLI), leaves receipts for
everything, and is designed so two of them can coordinate in an iteration
pipeline without a central model.

## What exists here (proven, tested)

```
oracle/oracle.py            deterministic repo-oracle (stdlib-only, no keys)
  build                     scan repo → .quilt/repo-map/{tree,symbols,heat}.json
  where/what/hot/touching   Q&A over the map (located symbols, file intel, heat)
  plan <issue>              drafts a cell-graph decomposition (LOCATE→EDIT→TEST→RECEIPT)
  ask <question>            routes free-text questions to the above
  verify                    receipt chain verify — fail-closed, named errors
  serve --port 4097         HTTP JSON API: /health /ask?q= /symbol/<n> /heat /map
oracle/fix-loop.sh          the expert-coder loop: claim → edit → test → receipt →
                            on fail: WHY-ledger + retry (≤3) → commit as a tick
oracle/self-test.sh         FAIL-first pins P0–P9 incl. tamper + custody-gap refusals
oracle/codespace-setup.sh   codespace boot: build + self-test + push evidence branch
driver/oracle-worker.sh     outside-in driver: create/wait/ssh (--keep) + watch mode
oracle/TASKS.md             claim board with lease (FREEZE-dial semantics)
oracle/DECOMPOSITION.md     worked example, self-decomposed
oracle/ADJUSTMENTS.md       the why-ledger (adjustment→cell discipline)
```

## The three laws of the loop

1. **Every edit is a tick.** A fix isn't done until it's committed and
   receipted; `.quilt/oracle-receipts.jsonl` is the sha256 custody chain
   (`task.claim → fix.attempt* → task.done`), verified by `oracle.py verify`
   and served on `/health`. Swap-in upgrade: quilt-in-git's hooks replace
   the emitter for full tick/cascade semantics (T3 on the board).
2. **No silent adjustments.** A failed attempt must append its WHY to
   ADJUSTMENTS.md before the retry. Each why is a candidate new cell; when
   the why-rate hits zero and pins stay green, the run has converged.
3. **The oracle is deterministic.** No network, no keys, no model calls. It
   answers from its own decomposition. Model calls are a *layer above*
   (see quilt-codespace's cell API) — the oracle stays a pure instrument so
   its answers are replayable.

## Codespace proof-of-concept protocol (one at a time, free tier)

1. Push this branch; create a Codespace from it (REST: `POST /user/codespaces`
   or `gh codespace create -R SuperInstance/quilt-codespace`).
2. post-create (guarded hook at the end of `.devcontainer/post-create.sh`)
   runs `oracle/codespace-setup.sh`: builds the repo-map, runs the pins,
   writes `oracle-evidence/boot-<ts>.json`, and pushes it to a dated
   `oracle-evidence-<ts>` branch — the agent proves it floated, no SSH
   needed from outside.
3. Optionally drive it live: `driver/oracle-worker.sh` (outside-in) with
   `--keep`, then `curl $URL/ask?q=where+is+chain_append`.
4. Two-in-a-pipeline is *documented, not yet run* (DECOMPOSITION.md §sketch):
   B watches A's `refs/quilt/*` via `git ls-remote` and claims unleased
   TASKS rows. Free-tier time budget: single-codespace PoC only this sprint.

## What's proven vs parked

- Proven: repo-map build; symbol/file/heat Q&A; deterministic plan drafts;
  receipt chain with tamper + custody-gap refusal; fix-loop end-to-end on
  the T1 fixture; HTTP surface; codespace boot script (evidence branch).
- Parked: full quilt-in-git tick engine swap (T3); two-codespace pipeline
  run (needs the single-loop evidence first); model-augmented plan() (the
  typesafe cell layer); repo-map freshness TTL (rebuild on post-commit).
