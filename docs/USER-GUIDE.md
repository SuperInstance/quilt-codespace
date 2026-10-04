# quilt-codespace — User Guide

For someone who wants to *use* the live Quilt Codespace runtime and the repo oracle —
hit cells over HTTP, read a repo through the oracle — without reading the fleet's
internal history first.

## What you get

- **A live Quilt runtime in a browser tab.** Open this repo as a GitHub Codespace and
  post-create gives you three services: a browser terminal running the Quilt TUI (port
  7681), an HTTP API for cell get/set/subscribe (port 4096), and a static federation
  dashboard (port 8080). One bearer token, generated at boot, guards the API.
- **An HTTP + SSE cell API** (`scripts/quilt-http-server.js`) that external things —
  IoT devices, other agents, sibling Codespaces — can call from anywhere via the
  Codespace's forwarded URL.
- **The deterministic repo oracle** (`oracle/oracle.py`, `tools/repo-oracle.mjs`): ask
  provenance/structure questions about a repo and get answers composed only from that
  repo's own records (git history, ledgers, receipts), with the full evidence trail.
  No network, no API keys, no model calls — replayable by construction.
- **A worked agent loop** (`oracle/fix-loop.sh` + `oracle/TASKS.md` +
  `oracle/ADJUSTMENTS.md`): claim a task, edit, test, receipt the outcome; failed
  attempts must book a WHY before retry.
- **The fed-autopilot example** (`examples/fed-autopilot/cell.yaml`): a 3-tier sheet
  showing how a Codespace subscribes to ESP32 sensors and Jetson perception and pushes
  PID tunables back down.

## Install

Two paths:

**Path 1 — the real thing (a Codespace):** On GitHub: "Use this template" → "Open in
Codespace". Wait ~2–3 minutes (free-tier provisioning measured at ~11 minutes in the
wave-50 receipts) for post-create. The terminal prints three URLs and a runtime token.
Save the token.

**Path 2 — just the API server, anywhere with Node >= 18:**

```bash
git clone https://github.com/SuperInstance/quilt-codespace
cd quilt-codespace
node scripts/quilt-http-server.js --port 4096 --token my-local-token
```

Path 2 uses the in-memory fallback engine unless `@quilt/core` is installed globally
(`npm i -g @quilt/core @quilt/sdk @quilt/cli`). The oracle tools are dependency-free
(python3 for `oracle/oracle.py`, Node for `tools/repo-oracle.mjs`).

## First success in 5 minutes

```bash
node scripts/quilt-http-server.js --port 14196 --token test-token &
sleep 1

# 1. Health (public, no auth):
curl -sf http://localhost:14196/health
# → {"ok":true,"tier":"codespace","uptime":0.42}

# 2. Read a seeded demo cell:
curl -sf -H "Authorization: Bearer test-token" \
     http://localhost:14196/cells/local/default/demo.greeting
# → {"value":"Hello from Quilt Codespace!","cell":"demo.greeting","sheet":"default"}

# 3. Write a cell:
curl -sf -X PUT -H "Authorization: Bearer test-token" -H "Content-Type: application/json" \
     -d '{"value": 42}' http://localhost:14196/cells/local/default/demo.visitor_count
# → {"ok":true,"value":42}

# 4. Subscribe (SSE) — stream starts with the current value, then pushes on change:
curl -N -H "Authorization: Bearer test-token" \
     http://localhost:14196/cells/local/default/demo.visitor_count/events
# → data: {"value":42}   (one line per change)

kill %1
```

## Everyday usage

### Run the repo oracle on any repo (read-only, offline)

```bash
node tools/repo-oracle.mjs ask /path/to/any/repo "what is the provenance of the current tip?"
node tools/repo-oracle.mjs ask . "what laws does this repo enforce and where do they live?"
node tools/repo-oracle.mjs ask <repo> "where do the receipt ledgers live?" --save docs/oracle-sessions
# --save writes a .md + .json transcript pair (the docs/oracle-sessions/ pattern)
```

The answer is composed from a fixed battery of 13 read-only probes; the transcript shows
which probes were promoted by your question and every raw finding.

### Ask the in-repo oracle (needs its map built first)

```bash
python3 oracle/oracle.py build                     # once, after clone (writes .quilt/repo-map/)
python3 oracle/oracle.py where chain_append        # locate a symbol (files + lines)
python3 oracle/oracle.py what oracle/oracle.py     # file intel: symbols, heat, neighbors
python3 oracle/oracle.py hot 5                     # top files by recent commit heat
python3 oracle/oracle.py plan "fix the ports doc drift in the http server"
#   → drafts oracle/DECOMPOSITION-draft.md as a LOCATE→EDIT→TEST→RECEIPT cell graph
python3 oracle/oracle.py ask "where is chain_append"
python3 oracle/oracle.py verify                    # fail-closed receipt-chain check
```

### Serve the oracle over HTTP

```bash
python3 oracle/oracle.py serve --port 4097 &
curl -s "localhost:4097/ask?q=where+is+chain_append"
curl -s localhost:4097/health      # includes the receipt-chain verdict
```

### Run the fix loop end-to-end (the bundled fixture is real)

```bash
bash oracle/fix-loop.sh T1 "bash oracle/self-test.sh --quick"
# Simulate mode: applies the bundled fixture patch (appends the Oracle API section to
# README.md if missing), runs the test command, receipts task.claim → fix.attempt →
# task.done on .quilt/oracle-receipts.jsonl, and commits as a tick if the tree changed.
```

### Drive a real Codespace from outside (requires `gh` CLI, authenticated)

```bash
bash driver/oracle-worker.sh create main    # create + wait + run oracle/codespace-setup.sh inside
bash driver/oracle-worker.sh ssh "curl -s localhost:4097/health"
bash driver/oracle-worker.sh watch SuperInstance/quilt-codespace 'refs/heads/*' --interval 30
bash driver/oracle-worker.sh delete
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `401 unauthorized` on `/cells/...` | Missing/wrong bearer token | Send `-H "Authorization: Bearer $QUILT_TOKEN"`; get the boot token from `cat ~/.quilt-env` in the Codespace |
| `400 bad json` on PUT | Body is not `{"value": ...}` | Wrap it: `-d '{"value": 42}'` |
| Server starts but formulas/AI cells do nothing | `@quilt/core` not installed; fallback engine stores values only | `npm i -g @quilt/core @quilt/sdk @quilt/cli` inside the Codespace, restart the server |
| `oracle.py where` says nothing / `NO_MATCH` | Repo-map not built | `python3 oracle/oracle.py build` first (P0 of the self-test exists to prove this refusal) |
| `self-test.sh` prints `skip - P0` / `skip - P9` | Map already built (P0's fail-first condition gone) / `--quick` mode (P9) | Skips are honest; for the full run use `bash oracle/self-test.sh` on a fresh clone |
| `E_NOT_A_REPO`, exit 2 from repo-oracle.mjs | Target path is not a git repo | Pass a path with a `.git` directory |
| Oracle answers say "(no commits yet)" | Target repo has no commits | That is the honest answer; commit something |
| `gh codespace create` fails in oracle-worker | No `gh` CLI, not authenticated, or branch missing | `gh auth status` first; the REST-only path is documented in ORACLE.md |
| Codespace lost its cells/token after rebuild | Codespaces are ephemeral | Persist state to a durable tier (Cloudflare/server); `~/.quilt/state/seed.json` is the local snapshot |
| Dashboard :8080 shows directory listing | `examples/` served statically — that is the dashboard | Open `fed-autopilot/` from the listing |

## FAQ

**Q: Is my data safe on the public API?**
The API is bearer-token guarded for everything except `/health` and `/meta` (public by
design, for sibling discovery). The token is generated at boot inside your Codespace and
never leaves it unless you share it. Treat any Codespace URL as public infrastructure
anyone with the token can write to — because that is the point: it is a federation tier,
not a private database.

**Q: Do the oracle tools call any AI model?**
No — that is law 3 of the loop (ORACLE.md): the oracle is deterministic, no network, no
keys, no model. It answers from the repo's own decomposition so its answers are
replayable. Model calls are a layer *above*, to be added by consumers (the parked
"typesafe cell layer" on the task board).

**Q: What can the oracle tell me about a repo?**
Everything the repo already says about itself: current tip and lineage (first commit,
authors, commit counts), hottest files by commit touches, file census, where docs and
receipt/ledger files live, whether any jsonl is hash-chain-shaped (and its tip), the
README's own self-description, manifest identity (package.json/pyproject/Cargo/go.mod),
scattered law/invariant statements with file:line refs, and whether the tree is dirty.

**Q: Why does the fix-loop commit by itself?**
"Every edit is a tick" is law 1: a fix is not done until it is committed and receipted.
The receipt chain (`.quilt/oracle-receipts.jsonl`, sha256-linked) is the custody proof;
`oracle.py verify` and the `/health` endpoint of serve mode check it fail-closed.

**Q: Can I run two of these Codespaces and have them cooperate?**
The design exists (`docs/two-agent-pipeline.md`), the watch tool exists
(`driver/oracle-worker.sh watch`), but the two-agent loop has NOT been run end-to-end —
free tier allows one Codespace at a time this sprint. Single-agent (fix-loop) is proven.

**Q: What is the difference between `oracle/oracle.py` and `tools/repo-oracle.mjs`?**
Different centers of gravity: `oracle.py` decomposes the *current tree* of this repo
(symbols, heat) and drafts fix plans; `repo-oracle.mjs` interrogates *any* repo's own
records (history, ledgers, laws) and answers with the full trail. They share the
doctrine — deterministic, read-only (for .mjs), receipted.
