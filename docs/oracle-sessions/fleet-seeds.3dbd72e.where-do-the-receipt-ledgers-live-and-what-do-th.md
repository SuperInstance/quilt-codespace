# oracle session — fleet-seeds 3dbd72e

- **repo**: /home/z/my-project/fleet-seeds
- **question**: where do the receipt ledgers live and what do the chain tips say?
- **focus**: receipts, location
- **tool**: tools/repo-oracle.mjs (deterministic battery, read-only, no model)

## decomposition (the trail)

Question tokens: [and, chain, do, ledgers, live, receipt, say, the, tips, what, where] → focus selected: [receipts, location] (matched: receipts:receipt|chain; location:where|live). The FIXED battery of 13 read-only probes ran in full — every probe, every ask, in declared order. The answer below is composed ONLY from these findings, in this trail order:
1. census.docs — where the repo writes prose about itself (PROMOTED by focus [location])
2. census.files — inventory: what the tree is made of (PROMOTED by focus [location])
3. git.authors — who wrote the record (battery default)
4. git.heat — which files carry the history (commit touches) (PROMOTED by focus [location])
5. git.identity — anchor: which repo state is being spoken about (battery default)
6. git.log.genesis — ancestry: where the repo came from (battery default)
7. git.log.recent — recency slice: the last thing this repo did (battery default)
8. git.state — honesty probe: is the tree clean at interrogation time (PROMOTED by focus [receipts])
9. laws.scan — where the repo states its own rules (law/invariant/never/always/must) (battery default)
10. ledger.chains — hash-chain custody: tips the repo itself seals (PROMOTED by focus [receipts])
11. ledger.receipts — detect the repo's receipt/ledger/provenance layer (PROMOTED by focus [receipts, location])
12. manifest.summary — declared identity: name, version, entry points (battery default)
13. readme.summary — the repo's self-description, in its own words (battery default)

## answer

Provenance of the current tip: 3dbd72e426eb on "main" — "qmr1-bridge CLI report labels its mode honestly: --check now prints 'CHECKED … …" at 2026-10-03T04:03:40Z, pushed to https://github.com/SuperInstance/fleet-seeds.git. The lineage begins at 1c540cc "fleet-seeds: 9 seeds + THE TAP TAVERN (round one sealed sto…" (2026-09-27T02:25:55Z); 159 commits later, the record is continuous.

Receipt/custody layer: 178 receipt-like files; 8 hash-chained ledger(s) with tips ledger/qmr1-store.jsonl→719123ffc6d8d575…, lode/lessons.jsonl→L23…, lode/mines.jsonl→M14….

Where things live: lode/engine (111 files), scouts/raw (80 files), playtest/wave41 (23 files), embassy/vc-oracle (21 files); prose in README.md, embassy/vc-envelope/README.md, embassy/vc-oracle/README.md, playtest/wave44/README.md, playtest/wave45/moth-census/README.md, qthe-verify/README.md, scouts/raw/wave63/readme-capitaine.md, scouts/raw/wave63/readme-doubt-ledger.md, scouts/raw/wave63/readme-frozen-clock-lab.md, scouts/raw/wave63/readme-quilt-in-git.md, scouts/receipts/2026-09-29-rsi/readme-EverMind-AI-Raven.md, scouts/receipts/2026-09-29-rsi/readme-Human-Agent-Society-reef.md, scouts/receipts/2026-09-29-rsi/readme-PrimeIntellect-ai-prime-agent.md, scouts/receipts/2026-09-29-rsi/readme-facebookresearch-HyperAgents.md, seeds/readme.md, tavern/round-11/README.md, tavern/round-12/README.md; history concentrates in PLANNING.md, lode/registry.jsonl, lode/lessons.jsonl.

## evidence (raw probe findings)

### git.identity

```json
{
  "head": "3dbd72e426ebf8a2e1c05bfd9acf513560321524",
  "branch": "main",
  "subject": "qmr1-bridge CLI report labels its mode honestly: --check now prints 'CHECKED … (wrote nothing)' instead of the produce-shaped 'PRODUCED appended=N' line (display-only fix caught by reading the check output; no law changed, 18/18 still green)",
  "date": "2026-10-03T04:03:40Z",
  "remote": "https://github.com/SuperInstance/fleet-seeds.git"
}
```

### git.log.recent

```json
{
  "total_commits": 159,
  "recent": [
    {
      "sha": "3dbd72e",
      "author": "Z User",
      "date": "2026-10-03T04:03:40Z",
      "subject": "qmr1-bridge CLI report labels its mode honestly: --check now prints 'CHECKED … (wrote nothing)' instead of th…"
    },
    {
      "sha": "882d7a9",
      "author": "Z User",
      "date": "2026-10-03T04:00:50Z",
      "subject": "qmr1-bridge: the lode ledgers' first honest producer (erised hardening move #1) — tools/qmr1-bridge.mjs seals…"
    },
    {
      "sha": "e9363fa",
      "author": "Clerk",
      "date": "2026-10-03T09:54:12+08:00",
      "subject": "scout: CI/CD canon — fleet pipeline landscape, 5 pollination patterns, no-CI repo menu; reference implementat…"
    },
    {
      "sha": "170ee7d",
      "author": "Clerk",
      "date": "2026-10-03T08:13:43+08:00",
      "subject": "zeroclaw v0 LIVE: single-file Minimax assistant loop, fnv1a-64 receipt chain; first standing order executed (…"
    },
    {
      "sha": "cc50532",
      "author": "Clerk",
      "date": "2026-10-03T07:57:16+08:00",
      "subject": "lode addendum: MothQuantum RESOLVED — token live (coin-toss + comet-qrng beacon receipts, CHSH S=2.793, submi…"
    },
    {
      "sha": "908588e",
      "author": "fleet-external",
      "date": "2026-10-03T07:39:50+08:00",
      "subject": "lode: ExoJ-Pincher / spreadsheet-ML / killer-app FOUNDATION — directive receipted (10 items), canon map (quil…"
    },
    {
      "sha": "c3d4b29",
      "author": "Z User",
      "date": "2026-10-02T23:18:20Z",
      "subject": "lode: wave-74 fold — JEV-WAVE-2 (the mask law held: 0 illegal, gap-gate 42.3% vs 62.3%, seat unpriced honest)…"
    },
    {
      "sha": "67daacb",
      "author": "Z User",
      "date": "2026-10-02T22:44:54Z",
      "subject": "lode: wave-73 fold — QD-CORE-1 (the dungeon becomes a quilt gym), SYNCOPATION-1 (wrong flips net-gain: syncop…"
    },
    {
      "sha": "65fceab",
      "author": "fleet-external",
      "date": "2026-10-03T06:25:45+08:00",
      "subject": "scout: dungeon-family playtest 2026-10-03 — quilt-dungeons 20/20 suite, 13 receipted runs, gym verifier 37/37…"
    },
    {
      "sha": "0594d1d",
      "author": "fleet-external",
      "date": "2026-10-03T06:20:50+08:00",
      "subject": "scout: external-lane agent-facing report 2026-10-03 — RD-005 commit-sha class closed (133/133, 0 rot), RD-001…"
    },
    {
      "sha": "b4c5e95",
      "author": "fleet-external",
      "date": "2026-10-03T06:11:07+08:00",
      "subject": "scout: RD-005 full-sweep rider 2026-10-03 — all 172 sha-like tokens in PLANNING.md, 0 rot; 133 git cites ance…"
    },
    {
      "sha": "ac1134d",
      "author": "Z User",
      "date": "2026-10-02T21:35:43Z",
      "subject": "lode: wave-72 fold — GREETER-LAW (the measured tell as a joint-selection rule, greeter-first routing, never-f…"
    }
  ]
}
```

### git.log.genesis

```json
{
  "roots": [
    "1c540cc2ccb1e602d70d02e4d1df753a4d42237b"
  ],
  "first_commit": {
    "sha": "1c540cc",
    "date": "2026-09-27T02:25:55Z",
    "subject": "fleet-seeds: 9 seeds + THE TAP TAVERN (round one sealed stone-v1 tip 4f94462f..., voices speak only from rece…"
  }
}
```

### git.authors

```json
{
  "distinct_authors": 14,
  "top": [
    {
      "name": "Z User",
      "commits": 120
    },
    {
      "name": "SuperInstance",
      "commits": 12
    },
    {
      "name": "fleet-external",
      "commits": 4
    },
    {
      "name": "Clerk",
      "commits": 3
    },
    {
      "name": "SuperInstance Fleet",
      "commits": 3
    },
    {
      "name": "Casey Digennaro",
      "commits": 3
    }
  ]
}
```

### git.heat

```json
{
  "touched_paths": 636,
  "hottest": [
    {
      "path": "PLANNING.md",
      "touches": 37
    },
    {
      "path": "lode/registry.jsonl",
      "touches": 16
    },
    {
      "path": "lode/lessons.jsonl",
      "touches": 12
    },
    {
      "path": "tavern/tavern_ledger.jsonl",
      "touches": 9
    },
    {
      "path": "lode/mines.jsonl",
      "touches": 6
    },
    {
      "path": "scouts/2026-09-28-contributions.md",
      "touches": 6
    },
    {
      "path": "lode/runs.jsonl",
      "touches": 5
    },
    {
      "path": "embassy/wave39-embassy-log.md",
      "touches": 5
    },
    {
      "path": "tavern/TAVERN.md",
      "touches": 5
    },
    {
      "path": "tavern/build_ledger.mjs",
      "touches": 5
    }
  ]
}
```

### census.files

```json
{
  "tracked_files": 635,
  "by_extension": [
    {
      "extension": "json",
      "count": 323
    },
    {
      "extension": "md",
      "count": 115
    },
    {
      "extension": "mjs",
      "count": 95
    },
    {
      "extension": "jsonl",
      "count": 53
    },
    {
      "extension": "py",
      "count": 9
    },
    {
      "extension": "txt",
      "count": 9
    },
    {
      "extension": "log",
      "count": 6
    },
    {
      "extension": "xml",
      "count": 4
    }
  ],
  "top_dirs": [
    {
      "dir": "lode/engine",
      "count": 111
    },
    {
      "dir": "scouts/raw",
      "count": 80
    },
    {
      "dir": "playtest/wave41",
      "count": 23
    },
    {
      "dir": "embassy/vc-oracle",
      "count": 21
    },
    {
      "dir": "tools/wave46",
      "count": 21
    },
    {
      "dir": "playtest/wave44",
      "count": 20
    },
    {
      "dir": "scouts/receipts",
      "count": 20
    },
    {
      "dir": "playtest/wave46",
      "count": 18
    }
  ]
}
```

### census.docs

```json
{
  "doc_files": 124,
  "readmes": [
    "README.md",
    "embassy/vc-envelope/README.md",
    "embassy/vc-oracle/README.md",
    "playtest/wave44/README.md",
    "playtest/wave45/moth-census/README.md",
    "qthe-verify/README.md",
    "scouts/raw/wave63/readme-capitaine.md",
    "scouts/raw/wave63/readme-doubt-ledger.md",
    "scouts/raw/wave63/readme-frozen-clock-lab.md",
    "scouts/raw/wave63/readme-quilt-in-git.md",
    "scouts/receipts/2026-09-29-rsi/readme-EverMind-AI-Raven.md",
    "scouts/receipts/2026-09-29-rsi/readme-Human-Agent-Society-reef.md",
    "scouts/receipts/2026-09-29-rsi/readme-PrimeIntellect-ai-prime-agent.md",
    "scouts/receipts/2026-09-29-rsi/readme-facebookresearch-HyperAgents.md",
    "seeds/readme.md",
    "tavern/round-11/README.md",
    "tavern/round-12/README.md"
  ],
  "docs_sample": [
    "FLEET.md",
    "PLANNING.md",
    "README.md",
    "docs/G1-SEAT-SPIKE.md",
    "docs/G7-WATT-RECEIPTS.md",
    "docs/GPU-AGENT-PLAYBOOK.md",
    "docs/M13-LLM-EXECUTOR-LEG.md",
    "docs/PREREGISTER.md",
    "docs/SEED-TOOLKIT.md",
    "docs/wave-63-run-construction.md",
    "embassy/battery/pong49_scorecard.md",
    "embassy/publish-queue-discovery.md",
    "embassy/round-34/letters/jev-quilt-42.md",
    "embassy/round-34/letters/pong-quilt-49.md",
    "embassy/round-34/letters/substrate-llm-client-new-issue.md",
    "embassy/round-34/round-34.md",
    "embassy/round-34/watch.md",
    "embassy/round-36/letters/jev-quilt-42.md"
  ]
}
```

### ledger.receipts

```json
{
  "receipt_like_files": 178,
  "sample": [
    "docs/G7-WATT-RECEIPTS.md",
    "embassy/vc-envelope/reader-a-receipt.json",
    "embassy/vc-envelope/verify-receipt.json",
    "embassy/vc-oracle/receipt.json",
    "embassy/vc-oracle/vectors/rfc8785/PROVENANCE.md",
    "ledger/qmr1-store.jsonl",
    "lode/engine/receipts/2026-09-29-engine-run-1/candidates.json",
    "lode/engine/receipts/2026-09-29-engine-run-1/priors.json",
    "lode/engine/receipts/2026-09-29-engine-run-1/qrng-seal.json",
    "lode/engine/receipts/2026-09-29-engine-run-1/scout/raw.json",
    "lode/engine/receipts/2026-09-29-engine-run-1/summary.json",
    "lode/engine/receipts/2026-09-29-engine-run-1/witness.json",
    "lode/engine/receipts/2026-09-29-engine-run-2/candidates.json",
    "lode/engine/receipts/2026-09-29-engine-run-2/priors.json"
  ],
  "groups": [
    {
      "group": "lode/engine",
      "count": 98
    },
    {
      "group": "tools/wave46",
      "count": 18
    },
    {
      "group": "scouts/receipts",
      "count": 17
    },
    {
      "group": "playtest/wave46",
      "count": 12
    },
    {
      "group": "playtest/wave45",
      "count": 8
    },
    {
      "group": "playtest/wave43",
      "count": 4
    },
    {
      "group": "receipts/g1",
      "count": 4
    },
    {
      "group": "embassy/vc-envelope",
      "count": 2
    }
  ]
}
```

### ledger.chains

```json
{
  "chain_shaped_files": 8,
  "chains": [
    {
      "file": "ledger/qmr1-store.jsonl",
      "rows": 4,
      "seq": 4,
      "tip": "719123ffc6d8d575"
    },
    {
      "file": "lode/lessons.jsonl",
      "rows": 23,
      "seq": null,
      "tip": "L23"
    },
    {
      "file": "lode/mines.jsonl",
      "rows": 14,
      "seq": null,
      "tip": "M14"
    },
    {
      "file": "playtest/wave41/battery/journals/journal_D.jsonl",
      "rows": 2,
      "seq": null,
      "tip": "c9-93-b7-1b-78-6"
    },
    {
      "file": "playtest/wave41/battery/journals/journal_N.jsonl",
      "rows": 2,
      "seq": null,
      "tip": "2f-e9-f4-88-8e-1"
    },
    {
      "file": "playtest/wave41/battery/journals/journal_S.jsonl",
      "rows": 1,
      "seq": null,
      "tip": "05-db-a8-f6-49-b"
    },
    {
      "file": "playtest/wave41/battery/journals/journal_U.jsonl",
      "rows": 3,
      "seq": null,
      "tip": "3a-5a-a6-57-c4-d"
    },
    {
      "file": "research/audit/mines-2026-09-29.jsonl",
      "rows": 10,
      "seq": null,
      "tip": "M10"
    }
  ]
}
```

### readme.summary

```json
{
  "file": "README.md",
  "lines": [
    "# fleet-seeds — the intake lane for new experiment repos",
    "> Every seed file becomes a repo. Every repo becomes a receipted experiment.",
    "## The one idea",
    "A question is cheapest to answer well at the exact moment it is asked — and",
    "most expensive to answer well any time after. Every fleet repo that skipped",
    "scaffolding at birth (CI, a smoke check, a charter) paid for it later as a",
    "script with no receipt and a claim with no number. **fleet-seeds turns",
    "\"I have an idea\" into \"I have a repo that can already prove or disprove",
    "itself\"** in one step, before the idea has had a chance to lose its rigor.",
    "## The mental model"
  ]
}
```

### manifest.summary

```json
{
  "kind": "none"
}
```

### laws.scan

```json
{
  "scanned_files": 24,
  "law_statements": [
    {
      "ref": "README.md:19",
      "text": "the rigor never depends on the mood of whoever is planting."
    },
    {
      "ref": "README.md:32",
      "text": "decision rules written BEFORE the run)"
    },
    {
      "ref": "README.md:36",
      "text": "a stage. A seed that never becomes a repo never had its rigor tested; a repo"
    },
    {
      "ref": "README.md:37",
      "text": "that never becomes a receipted experiment never answered its own question."
    },
    {
      "ref": "README.md:53",
      "text": "receipted experiment (house style: paired arms, decision rules receipted"
    },
    {
      "ref": "README.md:91",
      "text": "experiments with decision rules written before the run)."
    },
    {
      "ref": "README.md:99",
      "text": "*Part of the **quilt** family. Under [Law 6](https://github.com/SuperInstance/jev-quilt), this repo carries no verdicts…"
    },
    {
      "ref": "README.md:106",
      "text": "- [jev-quilt](https://github.com/SuperInstance/jev-quilt) `@5333e1a` — Law 6 (the Reader's Fold) and Law 7 (the Reach B…"
    },
    {
      "ref": "embassy/vc-envelope/README.md:21",
      "text": "| `@context` | `[\"https://www.w3.org/ns/credentials/v2\"]` (DM 2.0 §4.3: first value MUST be the v2 context) |"
    },
    {
      "ref": "embassy/vc-envelope/README.md:90",
      "text": "must agree byte-for-byte with the mint receipt:"
    },
    {
      "ref": "embassy/vc-envelope/README.md:98",
      "text": "| **B** (`verify.mjs`) | the document ONLY | own base58-btc decoder + multicodec `0xed01`; §3.3.2 flow incl. the @conte…"
    },
    {
      "ref": "embassy/vc-envelope/README.md:102",
      "text": "@context replacement → rejected by the §3.3.2 prefix rule."
    },
    {
      "ref": "embassy/vc-envelope/README.md:111",
      "text": "never written to disk, never printed, never transmitted**. Only the public"
    },
    {
      "ref": "embassy/vc-envelope/README.md:117",
      "text": "demands the prefix rule, then replaces the verification context with the"
    },
    {
      "ref": "embassy/vc-oracle/README.md:13",
      "text": "| `jcs.mjs` | JCS RFC 8785 canonicalizer — explicit ES6 number-to-string rule table; the one honest delegation (shortes…"
    }
  ]
}
```

### git.state

```json
{
  "dirty_entries": 1,
  "dirty_sample": [
    "?? scouts/geometry-of-seeds.md"
  ],
  "local_branches": 1,
  "tags": 0
}
```

