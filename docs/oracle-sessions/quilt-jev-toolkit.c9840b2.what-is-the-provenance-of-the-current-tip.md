# oracle session — quilt-jev-toolkit c9840b2

- **repo**: /home/z/my-project/quilt-jev-toolkit
- **question**: what is the provenance of the current tip?
- **focus**: provenance, identity
- **tool**: tools/repo-oracle.mjs (deterministic battery, read-only, no model)

## decomposition (the trail)

Question tokens: [current, is, of, provenance, the, tip, what] → focus selected: [provenance, identity] (matched: provenance:provenance|tip|current; identity:what|is). The FIXED battery of 13 read-only probes ran in full — every probe, every ask, in declared order. The answer below is composed ONLY from these findings, in this trail order:
1. census.docs — where the repo writes prose about itself (battery default)
2. census.files — inventory: what the tree is made of (PROMOTED by focus [identity])
3. git.authors — who wrote the record (PROMOTED by focus [provenance])
4. git.heat — which files carry the history (commit touches) (battery default)
5. git.identity — anchor: which repo state is being spoken about (PROMOTED by focus [provenance])
6. git.log.genesis — ancestry: where the repo came from (PROMOTED by focus [provenance])
7. git.log.recent — recency slice: the last thing this repo did (PROMOTED by focus [provenance])
8. git.state — honesty probe: is the tree clean at interrogation time (battery default)
9. laws.scan — where the repo states its own rules (law/invariant/never/always/must) (battery default)
10. ledger.chains — hash-chain custody: tips the repo itself seals (PROMOTED by focus [provenance])
11. ledger.receipts — detect the repo's receipt/ledger/provenance layer (battery default)
12. manifest.summary — declared identity: name, version, entry points (PROMOTED by focus [identity])
13. readme.summary — the repo's self-description, in its own words (PROMOTED by focus [identity])

## answer

Provenance of the current tip: c9840b245363 on "main" — "organ: Cell-Organ Snapshot & Boot v2 — checkpoint signatures + partial-custody …" at 2026-10-02T02:43:09Z, pushed to https://github.com/SuperInstance/quilt-jev-toolkit.git. The lineage begins at a41b1a7 "Initial commit: JEV canon oracle toolkit for Quilt" (2026-09-24T03:07:24Z); 8 commits later, the record is continuous.

## evidence (raw probe findings)

### git.identity

```json
{
  "head": "c9840b245363e116c84a4a2b93b9b5303fc0334f",
  "branch": "main",
  "subject": "organ: Cell-Organ Snapshot & Boot v2 — checkpoint signatures + partial-custody replay seeds (lane 65-b)",
  "date": "2026-10-02T02:43:09Z",
  "remote": "https://github.com/SuperInstance/quilt-jev-toolkit.git"
}
```

### git.log.recent

```json
{
  "total_commits": 8,
  "recent": [
    {
      "sha": "c9840b2",
      "author": "Z User",
      "date": "2026-10-02T02:43:09Z",
      "subject": "organ: Cell-Organ Snapshot & Boot v2 — checkpoint signatures + partial-custody replay seeds (lane 65-b)"
    },
    {
      "sha": "0895f5a",
      "author": "Z User",
      "date": "2026-10-02T01:03:42Z",
      "subject": "organ: Cell-Organ Snapshot & Boot v1 — rewind family + write-side transactions (lane 64-a)"
    },
    {
      "sha": "ecaf2e4",
      "author": "Z User",
      "date": "2026-10-01T23:21:10Z",
      "subject": "organ: Cell-Organ Snapshot & Boot protocol v0 (lane 63-c)"
    },
    {
      "sha": "2cb7d0e",
      "author": "Z User",
      "date": "2026-09-30T00:04:43Z",
      "subject": "fix(frontend): accept fleet-standard TYPESAFE_API_KEY (legacy TYPESAFEAI_KEY still works)"
    },
    {
      "sha": "1fa338c",
      "author": "mavis-bot",
      "date": "2026-09-25T21:16:45Z",
      "subject": "Merge upstream history"
    },
    {
      "sha": "ccedcb9",
      "author": "mavis-bot",
      "date": "2026-09-25T21:16:34Z",
      "subject": "Initial snapshot — auto-swept from local 2026-09-25"
    },
    {
      "sha": "db66b8f",
      "author": "Mavis",
      "date": "2026-09-24T03:15:28Z",
      "subject": "Add FLEET_GATE_RESULTS: JEV canon-gate ranking of 50 SuperInstance repos"
    },
    {
      "sha": "a41b1a7",
      "author": "Mavis",
      "date": "2026-09-24T03:07:24Z",
      "subject": "Initial commit: JEV canon oracle toolkit for Quilt"
    }
  ]
}
```

### git.log.genesis

```json
{
  "roots": [
    "ccedcb9a86a2b60e2df8100924ce3c2c90c8ef89",
    "a41b1a7c50823799d89d779ecbcb8f2fa3205fd6"
  ],
  "first_commit": {
    "sha": "a41b1a7",
    "date": "2026-09-24T03:07:24Z",
    "subject": "Initial commit: JEV canon oracle toolkit for Quilt"
  }
}
```

### git.authors

```json
{
  "distinct_authors": 3,
  "top": [
    {
      "name": "Z User",
      "commits": 4
    },
    {
      "name": "mavis-bot",
      "commits": 2
    },
    {
      "name": "Mavis",
      "commits": 2
    }
  ]
}
```

### git.heat

```json
{
  "touched_paths": 22,
  "hottest": [
    {
      "path": "README.md",
      "touches": 6
    },
    {
      "path": "docs/REVERSE-ACTUALIZED-SPEC.md",
      "touches": 3
    },
    {
      "path": "examples/receipts/boot-demo-receipt.json",
      "touches": 3
    },
    {
      "path": "package.json",
      "touches": 3
    },
    {
      "path": "src/organ/nest.mjs",
      "touches": 3
    },
    {
      "path": "test/organ.test.mjs",
      "touches": 3
    },
    {
      "path": "FLEET_GATE_RESULTS.md",
      "touches": 3
    },
    {
      "path": "JEV_FLEET_GATE.md",
      "touches": 3
    },
    {
      "path": "canon_gate.py",
      "touches": 3
    },
    {
      "path": "jev_client.py",
      "touches": 3
    }
  ]
}
```

### census.files

```json
{
  "tracked_files": 22,
  "by_extension": [
    {
      "extension": "mjs",
      "count": 12
    },
    {
      "extension": "md",
      "count": 4
    },
    {
      "extension": "json",
      "count": 4
    },
    {
      "extension": "py",
      "count": 2
    }
  ],
  "top_dirs": [
    {
      "dir": "src/organ",
      "count": 7
    },
    {
      "dir": "(root)",
      "count": 6
    },
    {
      "dir": "examples/receipts",
      "count": 3
    },
    {
      "dir": "docs/REVERSE-ACTUALIZED-SPEC.md",
      "count": 1
    },
    {
      "dir": "examples/boot-demo.mjs",
      "count": 1
    },
    {
      "dir": "examples/greeter-organ.mjs",
      "count": 1
    },
    {
      "dir": "examples/rewind-demo.mjs",
      "count": 1
    },
    {
      "dir": "examples/upload-v1-states.mjs",
      "count": 1
    }
  ]
}
```

### census.docs

```json
{
  "doc_files": 4,
  "readmes": [
    "README.md"
  ],
  "docs_sample": [
    "FLEET_GATE_RESULTS.md",
    "JEV_FLEET_GATE.md",
    "README.md",
    "docs/REVERSE-ACTUALIZED-SPEC.md"
  ]
}
```

### ledger.receipts

```json
{
  "receipt_like_files": 3,
  "sample": [
    "examples/receipts/boot-demo-receipt.json",
    "examples/receipts/rewind-v1-demo-receipt.json",
    "examples/receipts/rewind-v1-upload-receipt.json"
  ],
  "groups": [
    {
      "group": "examples/receipts",
      "count": 3
    }
  ]
}
```

### ledger.chains

```json
{
  "chain_shaped_files": 0,
  "chains": []
}
```

### readme.summary

```json
{
  "file": "README.md",
  "lines": [
    "# quilt-jev-toolkit",
    "> Small toolkit for using JEV (TypeSafe) as a Quilt canon oracle — and, since",
    "> wave 63, home of the **Cell-Organ Snapshot & Boot protocol**: use a",
    "> receipt-chain ledger to rewind, snapshot, and boot saved states of cells,",
    "> groups of cells (organs), or entire quilts, as drop-ins that nest inside",
    "> another program or quilt. v0 = custody (snapshot/boot/nest); v1 = the rewind",
    "> family + write-side transactions (below); v2 = checkpoint signatures +",
    "> partial-custody replay seeds (`--from-checkpoint`, bottom).",
    "JEV is a hosted oracle that answers yes/no, multiple choice, and",
    "scored questions about content. It's deterministic (variance < 0.01"
  ]
}
```

### manifest.summary

```json
{
  "kind": "package.json",
  "file": "package.json",
  "name": "quilt-jev-toolkit",
  "version": "0.1.0",
  "description": "JEV canon-oracle toolkit for Quilt + the Cell-Organ Snapshot & Boot protocol (v0 custody + v1 rewind family/transaction…",
  "scripts": [
    "test",
    "demo",
    "demo:rewind"
  ]
}
```

### laws.scan

```json
{
  "scanned_files": 4,
  "law_statements": [
    {
      "ref": "README.md:70",
      "text": "### The invariants (v0)"
    },
    {
      "ref": "README.md:86",
      "text": "(`organ.nest`, `organ.credit`), so host invariants are structurally safe and"
    },
    {
      "ref": "README.md:89",
      "text": "### The fail-closed rules"
    },
    {
      "ref": "README.md:91",
      "text": "Boot throws `OrganBootError` (never partially boots) on: `SCHEMA_DRIFT`,"
    },
    {
      "ref": "README.md:96",
      "text": "_HASH_MISMATCH / _STATE_MISMATCH` and never auto-repairs."
    },
    {
      "ref": "README.md:112",
      "text": "v1 adds three verbs on top of v0's snapshot/boot/nest. v0's law is carried over"
    },
    {
      "ref": "README.md:115",
      "text": "*before* any query, rewind, or write runs, so a rewind is never a forgery"
    },
    {
      "ref": "README.md:119",
      "text": "`seq`, hash-asserted against an independent prefix replay. Never mutates,"
    },
    {
      "ref": "README.md:120",
      "text": "never writes host receipts."
    },
    {
      "ref": "README.md:182",
      "text": "`failedOp: 1`, staged effects never leak, the bundle is byte-identical to"
    },
    {
      "ref": "README.md:235",
      "text": "# CUSTODY_GAP (unsigned gap — unchanged v0 law)"
    },
    {
      "ref": "README.md:246",
      "text": "O(history) — genesis is replayed once at checkpoint time, never at boot. The"
    },
    {
      "ref": "README.md:250",
      "text": "post-checkpoint custody is the v0 law (hash chain + replay == state). Ed25519"
    },
    {
      "ref": "docs/REVERSE-ACTUALIZED-SPEC.md:7",
      "text": "every invariant listed has a passing test or a fail-closed refusal behind it."
    },
    {
      "ref": "docs/REVERSE-ACTUALIZED-SPEC.md:26",
      "text": "invariant broke."
    }
  ]
}
```

### git.state

```json
{
  "dirty_entries": 0,
  "dirty_sample": [],
  "local_branches": 1,
  "tags": 0
}
```

