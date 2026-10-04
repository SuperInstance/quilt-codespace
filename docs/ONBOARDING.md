# quilt-codespace — Agent Onboarding
> Zero-shot entry point. Clone → competent in ~10 minutes.

## Identity (2 sentences)

quilt-codespace is a GitHub Codespace template that boots Quilt — the fleet's reactive
cell runtime — as a live, token-authenticated, federated runtime: a browser TUI (ttyd on
:7681), a zero-dependency HTTP API with SSE subscriptions (`scripts/quilt-http-server.js`
on :4096), and a static federation dashboard (:8080), all started by a devcontainer
post-create script. The repo also hosts the wave-66 "repo oracle" PoC: a deterministic,
no-network, no-keys git-agent component (`oracle/oracle.py`, `tools/repo-oracle.mjs`)
that answers provenance questions about repos from the repos' own records, receipted on a
sha256 chain.

## Why it exists (the fleet problem it solves)

The fleet needed Quilt running somewhere always-reachable and browser-visible — a tier
that IoT devices, sibling agents, and Codespaces can hit over HTTP — without owning a
server. GitHub gave Codespaces for free, and the agent-workspace-template pattern (waves
49–50 receipted the provisioning path: a Codespace reaches Available in ~11 minutes on
the free tier) supplied the substrate. Wave-66 then pushed further: if a Codespace can
*run* Quilt, can a repo-bound agent *know* its repo deterministically and *act* under
receipt discipline? The oracle PoC (ORACLE.md, tasks 66-d lineage), the fix-loop, the
claim board, and the two-agent pipeline sketch in `docs/two-agent-pipeline.md` are that
answer: proven single-agent, documented-not-yet-run two-agent.

## Verify it works (exact commands)

```bash
# A. The HTTP API — the repo's core capability. Zero deps, Node >= 18:
node scripts/quilt-http-server.js --port 14196 --token test-token &
sleep 1
curl -sf -H "Authorization: Bearer test-token" http://localhost:14196/health
#   → {"ok":true,"tier":"codespace","uptime":...}
curl -sf http://localhost:14196/meta
#   → {"tier":"codespace",...,"capabilities":{...},"siblings":["jetson","cloudflare","server"]}
curl -sf -H "Authorization: Bearer test-token" http://localhost:14196/cells/local/default/demo.greeting
#   → {"value":"Hello from Quilt Codespace!","cell":"demo.greeting","sheet":"default"}
kill %1

# B. The deterministic repo-oracle (needs python3, stdlib only) — build the map, run the pins:
python3 oracle/oracle.py build          # scans repo → .quilt/repo-map/{tree,symbols,heat}.json
bash oracle/self-test.sh                # pins P0–P9 incl. tamper + custody-gap refusals
#   → "self-test: 10 passed, 0 failed" on a fresh state (P0/P9 may report skip: see gotchas)

# C. The portable history-oracle (Node, read-only by law):
node tools/repo-oracle.mjs ask . "what is the provenance of the current tip?"
node tools/repo-oracle.mjs self-test    # 12/12 pins green, builds a throwaway fixture repo

# D. Full Codespace boot (the real thing): "Use this template" on GitHub → Open in
#    Codespace. post-create installs ttyd + quilt packages, starts the three services,
#    and runs oracle/codespace-setup.sh (guarded, non-fatal). Requires only the
#    Codespace's own GITHUB_TOKEN. Receipts land in oracle-evidence/ and, token willing,
#    on a dated oracle-evidence-<ts> branch.
```

A and C run with zero credentials. B runs offline (no network, no keys — that is oracle
law). D needs a GitHub account only; the runtime token it prints is generated at boot and
must never be committed.

## Reading order (paths, not vibes)

1. `README.md` — the three services, the federation model (`quilt://instance/sheet#cell`),
   the fed-autopilot 3-tier example, tier auto-detection.
2. `.devcontainer/devcontainer.json` + `.devcontainer/post-create.sh` — what a Codespace
   boot actually does (ports 7681/4096/8080, token generation, service startup, oracle
   hook).
3. `scripts/quilt-http-server.js` — the HTTP API: routes, auth, the @quilt/core fallback
   engine, seed state.
4. `ORACLE.md` — the oracle vision, the three laws of the loop, proven-vs-parked.
5. `oracle/oracle.py` → `oracle/self-test.sh` → `oracle/fix-loop.sh` → `oracle/TASKS.md` —
   the deterministic repo-oracle, its pins, the expert-coder loop, the claim board.
6. `tools/repo-oracle.mjs` — the portable 13-probe history-oracle and its self-test.
7. `docs/two-agent-pipeline.md` + `docs/oracle-sessions/` — the pipeline design and four
   real Q&A transcripts that show the oracle's answer shape.
8. `examples/fed-autopilot/cell.yaml` — the federation example sheet (remote cells,
   formulas, an AI cell, pushed tunables).

## The things that will bite you (gotchas)

- **Without `@quilt/core` the HTTP engine is a fallback key-value store.** The server
  tries `import('@quilt/core')` and warns to stderr if absent; the `SimpleEngine` fallback
  does NOT evaluate formulas, AI cells, or `metadata.remote` subscriptions from cell.yaml.
  `/health`, `/meta`, get/set/subscribe all still work. post-create installs the quilt
  packages but tolerates failure (`|| warn`), so a boot with only the fallback is common.
- **The default token trap.** If you start the server with neither `--token` nor
  `QUILT_TOKEN`, it listens with `dev-token-change-me`. Fine locally, never remotely.
- **`/health` and `/meta` are public by design** (sibling discovery); everything under
  `/cells/...` requires `Authorization: Bearer <token>`. PUT bodies must be
  `{"value": <json>}` — a bare JSON value is a 400.
- **Codespaces are ephemeral.** State lives in `~/.quilt/state/seed.json` and the token in
  `~/.quilt-env` — both vanish on rebuild. Anything long-lived must sync to a persistent
  tier (Cloudflare Worker, server).
- **The runtime token is printed to the boot log and stored plaintext in `~/.quilt-env`.**
  That is the documented pattern (single-tenant Codespace); never copy it into any file
  in the repo, never commit `.env`.
- **`oracle/self-test.sh` P0 and P9 can "skip"**: P0 (fail-first pre-build refusal) only
  runs when no repo-map exists yet; P9 (serve /health) is skipped under `--quick`. Skips
  are honest, not failures — the fail-first evidence lives in the first boot log.
- **`oracle/fix-loop.sh` makes real git commits** (as tick) when the tree is dirty and
  git works; run it on a branch if that bothers you. It also appends lease rows to
  `oracle/TASKS.md` — the board is append-only by law; never prune it.
- **`.quilt/` is gitignored** — the repo-map and receipt chain are runtime state, not
  committed artifacts. A fresh clone has no map until `oracle.py build` runs.
- **`driver/oracle-worker.sh watch` parses the interval from the 5th positional arg**:
  the accepted form is `watch <repo> <ref-glob> --interval <N>`; a bare third number is
  silently ignored (defaults to 30s).

## Where deeper knowledge lives

- Knowledge map: [docs/KNOWLEDGE-MAP.md](./KNOWLEDGE-MAP.md)
- Fleet journal: SuperInstance/superinstance-lab → worklog.md (grep 'quilt-codespace';
  local copy /home/z/my-project/worklog.md — waves 49/50 provisioning receipts at lines
  ~652–689, meta+external decomposition at ~1227)
- `docs/oracle-sessions/` — four real transcripts (.md + .json each) of the portable
  oracle answering questions about quilt-jev-toolkit, quilt-codespace, erised-exocortex,
  and fleet-seeds.
- `oracle/DECOMPOSITION.md`, `oracle/ADJUSTMENTS.md` — the worked T1 example and the
  why-ledger that shows the adjustment→cell discipline in practice.
- `ORACLE.md` "What's proven vs parked" — the honest boundary of the PoC.
- Sibling repos: `quilt` (engine + SDK + CLI this tier serves), `codespace-worker`
  (the one-shot offload pattern this repo's driver forked), `quilt-cloudflare`,
  `quilt-esp32` (the other federation tiers).

## Current frontier (what is open right now)

- **T2 on the claim board** (`oracle/TASKS.md`): wire the oracle's `/ask` into
  quilt-http-server's `/meta` so sibling discovery gets a brain.
- **T3**: swap the oracle's receipt emitter for quilt-in-git hooks — full tick/cascade
  semantics instead of the sha256 custody chain shim.
- **Two-agent pipeline**: documented in `docs/two-agent-pipeline.md`, explicitly NOT yet
  run (free-tier budget: one Codespace at a time this sprint). The outside-in leg
  (`driver/oracle-worker.sh`) and the watch dial (`git ls-remote refs/quilt/*`) exist;
  the full loop does not.
- **Model-augmented `plan()`**: the typesafe cell layer above the deterministic oracle is
  parked until the deterministic loop's receipts are exhausted.
- **Repo-map freshness TTL**: rebuild on post-commit is queued (the map goes stale as you
  edit; nothing rebuilds it automatically).
