# quilt-codespace — Engineering Notes

For engineers operating or reviewing the runtime and the oracle. Everything here is
traceable to repo files; anything else is labeled.

## Architecture

```
                        GitHub Codespace (this repo as template)
  ┌────────────────────────────────────────────────────────────────────────┐
  │  post-create.sh (.devcontainer)                                        │
  │    1. npm -g @quilt/core @quilt/sdk @quilt/cli   (tolerated failure)   │
  │    2. QUILT_TOKEN = rand(32B hex) → ~/.quilt-env  (never committed)    │
  │    3. ~/.quilt/{state,traces,logs,pids}                                │
  │    4. ttyd 1.7.7 → :7681  wraps  `quilt serve`          (TUI)          │
  │    5. node scripts/quilt-http-server.js → :4096         (HTTP + SSE)   │
  │    6. npx http-server examples/ → :8080                 (dashboard)    │
  │    7. bash oracle/codespace-setup.sh                    (guarded)      │
  │         └─ build repo-map → self-test pins → oracle-evidence/boot-<ts>.json
  │            → (if CODESPACE_NAME + GITHUB_TOKEN) push branch oracle-evidence-<ts>
  │                                                                        │
  │  quilt-http-server.js                                                  │
  │    public:  GET /health · GET /meta                                    │
  │    bearer:  GET/PUT /cells/:instance/:sheet/<cellPath>                 │
  │             GET /cells/.../<cellPath>/events  (SSE)                    │
  │             POST /evaluate                                             │
  │    engine:  @quilt/core (if installed) else SimpleEngine fallback      │
  │    state:   ~/.quilt/state/seed.json (loaded at boot; written if absent)│
  └────────────────────────────────────────────────────────────────────────┘
              │  subscribes to / pushes to siblings
              ▼
   quilt://esp32-fleet/boat#sensor.rudder      (ESP32 tier — quilt-esp32)
   quilt://jetson-lab/perception#vision.wind   (Jetson tier — planned)
   quilt://cloud-fleet/audit#autopilot...      (Cloudflare tier — quilt-cloudflare)

  Oracle layer (deterministic, offline, no model):
    oracle/oracle.py        repo-map(.quilt/repo-map/*) + receipt chain(.quilt/oracle-receipts.jsonl)
                            CLI + HTTP :4097 (/health /map /ask?q= /symbol/<n> /heat)
    tools/repo-oracle.mjs   any-repo battery (13 read-only git/fs probes) → trail + answer
    oracle/fix-loop.sh      claim(TASKS.md lease) → edit → test → receipt; WHY-ledger on fail
    driver/oracle-worker.sh outside-in: gh codespace create/ssh/delete + ls-remote watch
```

Data flows are one-directional per law: the runtime serves cells; the oracle reads the
repo; the fix-loop writes the tree only through receipts (claim → attempt → done) and a
single commit. Nothing here deletes.

## Invariants

1. **Fail-closed custody** — `oracle.py chain_verify` refuses `CUSTODY_GAP` (prev/seq
   break) and `RECEIPT_HASH_MISMATCH` (tampered row), enforced in `chain_verify()` and
   pinned by self-test P7/P8 (negative pins on /tmp copies, never the live ledger).
2. **Read-only oracle** — `tools/repo-oracle.mjs` invokes only `rev-parse`, `log`,
   `ls-files`, `branch`, `tag`, `status --porcelain` via execFileSync (no shell); proven
   by the self-test's `readonly.head_unchanged` pin. `oracle.py` writes only under
   `.quilt/` and the two generated markdown drafts.
3. **Auth boundary** — everything except `/health` and `/meta` requires
   `Authorization: Bearer <QUILT_TOKEN>` (enforced at the single `authenticate()` gate in
   quilt-http-server.js).
4. **Append-only coordination surfaces** — TASKS.md rows, ADJUSTMENTS.md whys, the
   receipt chain, and the git history itself are never rewritten; stale leases expire
   rather than being deleted.
5. **Boot evidence or silence** — codespace-setup.sh either leaves
   `oracle-evidence/boot-<ts>.json` (and optionally a dated evidence branch) or says why
   on stderr; a failed evidence push is reported, not hidden.
6. **No secrets in the tree** — the token is generated at boot into `~/.quilt-env`
   (outside the repo); `.gitignore` excludes `.env*` and `.quilt/`.

## Failure modes & blast radius

| Failure | Behavior | Blast radius |
|---|---|---|
| `@quilt/core` install fails (sudo/network) | post-create warns and continues; server uses SimpleEngine fallback | Formulas/AI cells inert; get/set/subscribe still work — degraded, not down |
| Token missing at server start | Falls back to `dev-token-change-me` | Local-only acceptable; remote = anyone can write. Mitigation: post-create always sets one |
| Codespace rebuild | `~/.quilt/state`, `~/.quilt-env` erased | State loss by design (ephemeral tier); docs route persistence to durable tiers |
| SSE subscriber behind idle-killing proxy | Stream drops silently (no heartbeat frames) | Subscriber reconnects; no data corruption (last value re-sent as initial event) |
| Repo-map stale after edits | `where/what/hot` answer from build-time snapshot | Wrong-but-honest answers (they cite the map, not the tree); TTL rebuild is a queued task |
| Receipt chain tampered | `verify` and serve-mode `/health` name the row and error | Refusal, not repair — the tamper IS the finding |
| fix-loop test command always red | 3 attempts, 3 WHY lines, `task.failed` receipt, exit 1 | One commit-less, append-only residue; the board and ledger record the cost |
| `gh codespace create` stuck Provisioning | oracle-worker `wait_ready` polls 60×5s then times out | None persistent — delete by hand (`delete` verb); wave-49 receipted this pattern (it was impatience: ~11 min) |
| Evidence-branch push denied | Non-fatal warning; evidence stays local | None — the boot receipt still exists in `oracle-evidence/` |

## Performance & cost envelope

- **HTTP server**: single-process Node, in-memory Map + Set listeners; SSE pushes are
  O(listeners) per change. Measured only by smoke (boots in <1s, answers /health
  immediately); no load receipts exist — labeled estimate: fine for tier-appropriate
  traffic (IoT-scale event rates), not a public service.
- **oracle.py build**: walks the tree (skip `.git`, `node_modules`, `.quilt`; symbol-scan
  files < 400 KB) + one `git log -n 300` — seconds on this repo. Unmeasured on large
  repos (labeled).
- **repo-oracle.mjs battery**: 13 git/fs reads with a 20s per-probe timeout and 32 MB
  buffer cap; the wave-66 transcripts (docs/oracle-sessions/) show full-battery answers
  on real fleet repos (e.g. quilt-jev-toolkit @ c9840b2, 8 commits, 4 authors).
- **Cost**: free-tier Codespace (basicLinux32gb, ~11 min provisioning receipted in the
  wave-50 journal); zero paid services; oracle spend is strictly zero (no keys, no
  network). The wave-50 journal recorded the whole codespace lane at $0 API spend.

## Operations

- **Local**: `node scripts/quilt-http-server.js --port 4096 --token <secret>`; oracle via
  `python3 oracle/oracle.py ...` and `node tools/repo-oracle.mjs ...`. No installs.
- **Codespace**: template → post-create does everything; ports auto-forward with the
  labels TUI/API/Dashboard; `cat ~/.quilt-env` shows the boot token; PIDs in
  `~/.quilt/pids/`, logs in `~/.quilt/logs/`.
- **CI**: `.github/workflows/ci.yml` on push/PR to main (Node 22): YAML-parse the example
  sheet, JSON-parse devcontainer.json, HTTP smoke on :14196. Note: the YAML check is
  `|| true` — a malformed cell.yaml warns but does not fail CI (honest wrinkle; the JSON
  check and HTTP smoke are hard gates).
- **Credentials model**: exactly two credential classes, both env-only: (1) the Codespace
  runtime token (generated at boot, `~/.quilt-env`, printed to the operator's own
  terminal); (2) the Codespace's `GITHUB_TOKEN` used by codespace-setup.sh for the
  evidence push. Neither is ever committed; no other keys exist (oracle law).
- **Two-agent operation (design)**: A inside the Codespace runs decompositions + fix-loop;
  B outside runs `driver/oracle-worker.sh`; they share the remote's refs — B watches with
  `git ls-remote` (kilobytes, no clone). Documented only; not yet receipted end-to-end.

## Design decisions & why

1. **Three services on three ports, started by one script** — the tier contract (TUI for
   humans, API for machines, dashboard for orientation) mirrors the cocapn 5-tier room
   model (README's table); one post-create keeps the template zero-thought. Tradeoff: the
   boot script is the repo's real complexity hotspot (~144 lines) and fails soft per
   service.
2. **Self-contained HTTP server with a fallback engine** — the API must boot even without
   the upstream `@quilt/core` package, so CI and local verification never block on an
   external registry. Tradeoff: the fallback ignores formulas/AI cells — an honesty
   boundary stated in the server's own startup warning.
3. **Deterministic oracle, model above it** (ORACLE.md law 3) — replayable answers and a
   clean seam for later model augmentation (`plan()` on the typesafe cell layer). The
   74-a/75-a studies in quilt-atlas later measured exactly this reflex/reflect split at
   the account level, corroborating the architecture.
4. **Receipt chain + named refusals instead of a database** — custody the fleet can
   verify with `verify` or `curl /health`; fail-closed errors make tamper a finding, not
   a mystery. Tradeoff: no compaction, no queries beyond the chain — fine at PoC scale.
5. **File-based two-agent protocol (no broker)** — decompositions, leases, receipts, and
   verdicts are versioned text; git log IS the run history (two-agent-pipeline.md). 
   Tradeoff: polling latency (ls-remote intervals) instead of push, accepted for
   replayability.
6. **Evidence branches instead of SSH verification** — a Codespace proves it floated by
   pushing `oracle-evidence-<ts>`; the outside world never needs interactive access.
   Tradeoff: depends on the Codespace token's push scope; failure path is non-fatal and
   visible.
