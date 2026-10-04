# quilt-codespace — Developer Guide

For developers extending the runtime (new endpoints, new engine wiring) or the oracle
(new probes, new loop semantics). Everything cited here is in the repo at HEAD.

## Code layout

```
quilt-codespace/
├── scripts/quilt-http-server.js   # the HTTP API (222 lines, zero-dep Node):
│                                  #   args (--port/--token/--state) → engine load
│                                  #   (@quilt/core or SimpleEngine fallback) →
│                                  #   seed.json load/default demo cells → routes
├── .devcontainer/
│   ├── devcontainer.json          # universal image; node 22 + python 3.12 + din-docker
│   │                              #   features; ports 7681/4096/8080 with labels;
│   │                              #   containerEnv QUILT_TIER/QUILT_INSTANCE_ID
│   └── post-create.sh             # boot: npm -g quilt packages → token gen (~/.quilt-env)
│                                  #   → state dirs → ttyd 1.7.7 → ttyd :7681 (quilt serve)
│                                  #   → http server :4096 → http-server :8080 (examples/)
│                                  #   → guarded oracle/codespace-setup.sh
├── .github/workflows/ci.yml       # smoke: YAML-parse cell.yaml, JSON-parse devcontainer,
│                                  #   boot server on 14196 with test-token, curl /health+/meta
├── oracle/
│   ├── oracle.py                  # deterministic repo-oracle (306 lines, stdlib only):
│   │                              #   build/where/what/hot/touching/plan/ask/receipt/
│   │                              #   verify/serve
│   ├── self-test.sh               # pins P0–P9 (fail-first, tamper, custody-gap, serve)
│   ├── fix-loop.sh                # the expert-coder loop: claim → edit → test → receipt,
│   │                              #   ≤3 tries, WHY-ledger on fail, commit-as-tick on pass
│   ├── fixture-patch.sh           # the bundled REAL fixture (README oracle section)
│   ├── codespace-setup.sh         # boot evidence: oracle-evidence/boot-<ts>.json +
│   │                              #   selftest log + optional evidence-branch push
│   ├── TASKS.md                   # append-only claim board (T1/T2/T3, 30-min leases)
│   ├── DECOMPOSITION.md           # worked T1 cell graph + loop invariants + 2-agent sketch
│   ├── DECOMPOSITION-draft.md     # (generated) plan() output target
│   └── ADJUSTMENTS.md             # the why-ledger (append-only)
├── tools/repo-oracle.mjs          # portable history-oracle (568 lines): 13 read-only
│                                  #   probes, focus rules, trail composition, --json,
│                                  #   --save, self-test with throwaway fixture repo
├── driver/oracle-worker.sh        # outside-in driver: create/ssh/delete/watch (gh CLI)
├── docs/
│   ├── two-agent-pipeline.md      # design-only iteration pipeline (A decomposes →
│   │                              #   B executes → B's diff is A's new evidence)
│   └── oracle-sessions/           # 4 real transcripts, .md + .json each
├── examples/fed-autopilot/cell.yaml  # 3-tier federation sheet (remote refs, formulas,
│                                      #   ai.anomaly_score cell, pushed tunables, audit)
├── ORACLE.md                      # the PoC charter: vision, three laws, protocol,
│                                  #   proven-vs-parked
└── README.md                      # runtime user docs (services, federation, tiers)
```

No package.json anywhere — the repo's own code is deliberately dependency-free; the only
npm surface is what post-create installs *into* the Codespace (`@quilt/core`, `@quilt/sdk`,
`@quilt/cli` — the upstream runtime this tier serves).

## Core concepts (named as the code names them)

- **The three laws of the loop** (ORACLE.md): (1) every edit is a tick — committed and
  receipted; (2) no silent adjustments — a failed attempt appends a WHY to ADJUSTMENTS.md
  before retry; (3) the oracle is deterministic — no network, no keys, no model.
- **Receipt chain** (`oracle.py: chain_append/chain_load/chain_verify`): append-only
  JSONL at `.quilt/oracle-receipts.jsonl`; each row `{seq, op, payload, at, prev, tip}`
  with `tip = sha256("seq|op|canonical_payload|prev")`, genesis `prev = "genesis"`.
  `verify` fails closed with named errors `CUSTODY_GAP` (seq/prev break) and
  `RECEIPT_HASH_MISMATCH` (tampered row).
- **Repo-map** (`.quilt/repo-map/`): `tree.json` (path+size), `symbols.json` (regex-extracted
  defs for .py/.js/.mjs/.ts/.sh, files < 400 KB), `heat.json` (per-file commit touches from
  the last 300 commits). Built by `oracle.py build`; every query receipts itself
  (`ask.where`, `plan.draft`, `serve.start` ops).
- **The battery** (`tools/repo-oracle.mjs`): 13 fixed read-only probes — `git.identity`,
  `git.log.recent`, `git.log.genesis`, `git.authors`, `git.heat`, `census.files`,
  `census.docs`, `ledger.receipts`, `ledger.chains`, `readme.summary`,
  `manifest.summary`, `laws.scan`, `git.state` — every probe, every ask, in declared
  order. Focus rules (laws/receipts/provenance/location/inventory/identity) only *promote*
  probes in the answer trail; they never suppress evidence.
- **Claim board + lease** (`oracle/TASKS.md`): append a `claimed` row with handle + lease
  timestamp; stale (30 min) leases may be `re-claimed`; never delete rows. This is the
  soft-joint version of quilt-in-git's FREEZE dial.
- **Cell path routing** (http-server): `/cells/:instance/:sheet/:cellPath...` — cellPath
  may contain slashes; `/events` suffix upgrades the route to SSE.
- **Federation URI** (`quilt://[instance]/[sheet]#[cell]`): the addressing scheme for
  cross-tier cells; in cell.yaml it appears as `metadata.remote` on subscribed/pushed
  cells.

## How to extend

### Add an HTTP endpoint

Add a route in `http.createServer(async (req, res) => ...)` of
`scripts/quilt-http-server.js`, keeping the auth boundary honest (public = health/meta
only):

```js
// after the /cells block, before notFound(res):
if (req.url === '/snapshot' && req.method === 'GET') {
  return json(res, 200, Object.fromEntries(engine.cells));
}
```

If the endpoint should be public, put it above the `if (!authenticate(req))` line and say
so in ORACLE.md-adjacent docs; if authenticated, below it. Then extend the CI smoke
(`.github/workflows/ci.yml`) with a curl pin so the route is covered on every push.

### Add a probe to the battery

Add an object to `PROBES` in `tools/repo-oracle.mjs` with `name`, `why`, `run(repo)`:

```js
{
  name: "git.tags.recent",
  why: "release rhythm: what the repo ships and when",
  run(repo) {
    const out = git(repo, "tag", "--sort=-creatordate", "--format=%(refname:short)|%(creatordate:iso)");
    return { tags: out.split("\n").filter(Boolean).slice(0, 10).map(oneLine) };
  },
},
```

Then (a) add a guard in `compose()` that renders the finding into a bullet — every probe
may fail, so guard on the finding's shape; (b) optionally map it into a `FOCUS_PROBES`
list; (c) run `node tools/repo-oracle.mjs self-test` — the `ask.probes.ran` pin compares
evidence length against `PROBES.length`, so the count pin updates itself. Keep the
read-only law: only `rev-parse`, `log`, `ls-files`, `branch`, `tag`,
`status --porcelain` (plus readFileSync) inside probes.

### Add a task to the claim board

Append a row to `oracle/TASKS.md` (never edit old rows):

```
| T4  | <task>                                              | open     | —               | —           | <note> |
```

Claim it exactly as fix-loop does: append a `claimed` line with your handle and a
30-minute lease, then `python3 oracle/oracle.py receipt task.claim '{"task":"T4"}'`.

### Extend the seed state

Either write `~/.quilt/state/seed.json` (`{ "cell.path": value, ... }` — loaded at boot)
or change the default demo block in `scripts/quilt-http-server.js`. Seed keys are flat
cell paths; the fallback engine does not compute them.

## Testing

```bash
# CI-equivalent smoke (what .github/workflows/ci.yml runs on every push/PR to main):
node scripts/quilt-http-server.js --port 14196 --token test-token &
sleep 1
curl -sf -H "Authorization: Bearer test-token" http://localhost:14196/health
curl -sf http://localhost:14196/meta | head -1
kill %1

# Oracle pins (needs python3; P9 boots a real server on :4097 unless --quick):
bash oracle/self-test.sh              # expect "self-test: 10 passed, 0 failed" on a fresh clone

# Portable-oracle pins (builds a throwaway 2-commit fixture repo in /tmp):
node tools/repo-oracle.mjs self-test  # expect "12/12 pins green"
```

What green means: P1 build receipted a map; P2–P5 answered from it; P6 chain verifies;
P7/P8 prove tamper and custody-gap are refused *by name* (negative pins, run on copies in
/tmp — the real ledger is never touched); P9 proves serve mode. The .mjs self-test proves
shape, focus routing, law detection, non-repo refusal (`E_NOT_A_REPO`, exit 2), empty-repo
honesty, and the read-only guarantee (fixture HEAD unchanged). CI (Node 22, ubuntu-latest)
runs only the HTTP smoke plus YAML/JSON well-formedness checks — the oracle pins are not
in CI; run them locally.

## Conventions

- **Receipt ops are named verbs**: `build.repo-map`, `ask.where`, `plan.draft`,
  `serve.start`, `task.claim`, `fix.attempt`, `task.done`, `task.failed`. New ops follow
  `<subject>.<verb>` and go through `chain_append`, never raw appends.
- **Append-only surfaces**: TASKS.md rows, ADJUSTMENTS.md WHY lines, the receipt chain.
  Nothing is ever deleted; rewind is a new commit.
- **Fail closed with named errors**: `CUSTODY_GAP`, `RECEIPT_HASH_MISMATCH`,
  `PATH_NOT_IN_MAP`, `NO_MATCH`, `EMPTY_QUESTION`, `E_NOT_A_REPO`, `E_PATH_MISSING`.
  A refusal you cannot name is a bug.
- **Determinism over cleverness**: no clocks in oracle answers (commit time is the
  receipt time), keyword scoring over embeddings, execFileSync over shell string
  interpolation (the question never reaches a shell).
- **Commit style**: fix-loop commits as `stitcher-oracle <oracle@superinstance.local>`
  with the task ID and a receipt-chain/adjustments footer; evidence pushes go to dated
  `oracle-evidence-<ts>` branches.

## Gotchas for editors

- **The fallback engine is the one that runs in CI** — `@quilt/core` is not a public
  dependency of this repo, so any endpoint change must work against `SimpleEngine`
  semantics (plain get/set/subscribe, no evaluation).
- **`parseCellPath` requires >= 4 path segments** — `/cells/local/default/x` works;
  `/cells/local/x` is a 404. Sheet and instance names are effectively opaque strings to
  the fallback engine (it keys by cellPath only).
- **SSE has no heartbeat**: the stream sends initial value + changes only; proxies that
  kill idle connections will interrupt long subscriptions.
- **`oracle.py plan` overwrites `oracle/DECOMPOSITION-draft.md`** — it is a generated
  file; hand-amendments belong in DECOMPOSITION.md (the worked example) with whys in
  ADJUSTMENTS.md, exactly as the T1 example documents.
- **The symbol scanner is line-anchored** (`^def`, `^function`, `^const x =`...) — symbols
  defined mid-line or exported re-exports are invisible to `where`/`touching`; the
  substring fallback in `where()` is the safety net.
- **Heat is a 300-commit window** (`git log -n 300`): on young repos the whole history
  counts; on huge repos old heat vanishes. Do not compare heat across repos of very
  different ages.
- **`codespace-setup.sh` pushes with the Codespace's `GITHUB_TOKEN`** via an
  `x-access-token:` URL — never "improve" this to persist a token; the env var exists only
  inside the Codespace and the push failure path (scope denied) is non-fatal by design.
- **`driver/oracle-worker.sh` hard-codes `basicLinux32gb`** with a fallback to the default
  machine — if you change the tier, re-verify the wave-50 receipts' provisioning windows
  (Available at ~11 min on free tier).
