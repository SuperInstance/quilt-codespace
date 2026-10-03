# oracle session — erised-exocortex 661acc6

- **repo**: /home/z/my-project/erised-exocortex
- **question**: what laws does this repo enforce and where do they live?
- **focus**: laws, location
- **tool**: tools/repo-oracle.mjs (deterministic battery, read-only, no model)

## decomposition (the trail)

Question tokens: [and, do, does, enforce, laws, live, repo, they, this, what, where] → focus selected: [laws, location] (matched: laws:laws|enforce; location:where|live). The FIXED battery of 13 read-only probes ran in full — every probe, every ask, in declared order. The answer below is composed ONLY from these findings, in this trail order:
1. census.docs — where the repo writes prose about itself (PROMOTED by focus [laws, location])
2. census.files — inventory: what the tree is made of (PROMOTED by focus [location])
3. git.authors — who wrote the record (battery default)
4. git.heat — which files carry the history (commit touches) (PROMOTED by focus [location])
5. git.identity — anchor: which repo state is being spoken about (battery default)
6. git.log.genesis — ancestry: where the repo came from (battery default)
7. git.log.recent — recency slice: the last thing this repo did (battery default)
8. git.state — honesty probe: is the tree clean at interrogation time (battery default)
9. laws.scan — where the repo states its own rules (law/invariant/never/always/must) (PROMOTED by focus [laws])
10. ledger.chains — hash-chain custody: tips the repo itself seals (battery default)
11. ledger.receipts — detect the repo's receipt/ledger/provenance layer (PROMOTED by focus [location])
12. manifest.summary — declared identity: name, version, entry points (battery default)
13. readme.summary — the repo's self-description, in its own words (PROMOTED by focus [laws])

## answer

Laws this repo states about itself: README.md:14 — “## The three laws”; README.md:16 — “| law | what it says | where it lives |”; README.md:19 — “| **DEADBAND** | inside an ExoJ's envelope the beat costs **zero thought-tokens** — the s…”; README.md:98 — “The same three laws describe the fleet's own lane discipline: state-first,”; README.md:124 — “Keys live in `/home/z/my-project/.env.keys` (chmod 600, gitignored, never”; README.md:135 — “repair is receipted as `scar` ops, never silent. The story honors every”. They live exactly at the cited file:line refs.

Where things live: (root) (6 files), nights/vesper-session.json (1 files), presets/vesper-table.json (1 files), story/one-night.md (1 files); prose in README.md; history concentrates in exocortex.mjs, play.mjs, presets/vesper-table.json.

## evidence (raw probe findings)

### git.identity

```json
{
  "head": "661acc643ddbbee48def16b7541117cd7f842a74",
  "branch": "main",
  "subject": "the session of record: 3 live nights, 178 ops, the token-migration curve receipted",
  "date": "2026-10-03T05:29:32Z",
  "remote": "https://github.com/SuperInstance/erised-exocortex.git"
}
```

### git.log.recent

```json
{
  "total_commits": 2,
  "recent": [
    {
      "sha": "661acc6",
      "author": "SuperInstance",
      "date": "2026-10-03T05:29:32Z",
      "subject": "the session of record: 3 live nights, 178 ops, the token-migration curve receipted"
    },
    {
      "sha": "b965bd3",
      "author": "SuperInstance",
      "date": "2026-10-03T05:09:59Z",
      "subject": "erised-exocortex v0: the autopilot layer — ExoJ compile/deadband/interrupt laws, 12/12 pins, vendored sequenc…"
    }
  ]
}
```

### git.log.genesis

```json
{
  "roots": [
    "b965bd327aaba045156fc059300f3886f1d64c7a"
  ],
  "first_commit": {
    "sha": "b965bd3",
    "date": "2026-10-03T05:09:59Z",
    "subject": "erised-exocortex v0: the autopilot layer — ExoJ compile/deadband/interrupt laws, 12/12 pins, vendored sequenc…"
  }
}
```

### git.authors

```json
{
  "distinct_authors": 1,
  "top": [
    {
      "name": "SuperInstance",
      "commits": 2
    }
  ]
}
```

### git.heat

```json
{
  "touched_paths": 10,
  "hottest": [
    {
      "path": "exocortex.mjs",
      "touches": 2
    },
    {
      "path": "play.mjs",
      "touches": 2
    },
    {
      "path": "presets/vesper-table.json",
      "touches": 2
    },
    {
      "path": "README.md",
      "touches": 1
    },
    {
      "path": "nights/vesper-session.json",
      "touches": 1
    },
    {
      "path": "story/one-night.md",
      "touches": 1
    },
    {
      "path": ".gitignore",
      "touches": 1
    },
    {
      "path": "DESIGN.md",
      "touches": 1
    },
    {
      "path": "engine.mjs",
      "touches": 1
    },
    {
      "path": "test/pins.mjs",
      "touches": 1
    }
  ]
}
```

### census.files

```json
{
  "tracked_files": 10,
  "by_extension": [
    {
      "extension": "mjs",
      "count": 4
    },
    {
      "extension": "md",
      "count": 3
    },
    {
      "extension": "json",
      "count": 2
    },
    {
      "extension": "gitignore",
      "count": 1
    }
  ],
  "top_dirs": [
    {
      "dir": "(root)",
      "count": 6
    },
    {
      "dir": "nights/vesper-session.json",
      "count": 1
    },
    {
      "dir": "presets/vesper-table.json",
      "count": 1
    },
    {
      "dir": "story/one-night.md",
      "count": 1
    },
    {
      "dir": "test/pins.mjs",
      "count": 1
    }
  ]
}
```

### census.docs

```json
{
  "doc_files": 3,
  "readmes": [
    "README.md"
  ],
  "docs_sample": [
    "DESIGN.md",
    "README.md",
    "story/one-night.md"
  ]
}
```

### ledger.receipts

```json
{
  "receipt_like_files": 0,
  "sample": [],
  "groups": []
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
    "# erised-exocortex",
    "**The autopilot layer for erised iterators** — iterators that play several nights",
    "compile their proven strategies into reusable autoplay scripts (**ExoJs**), run",
    "them with a **deadband for surprise**, spend the freed thought-budget reading",
    "*each other*, and re-imagine their scripts when the world refuses them.",
    "Part of the erised line: erised (the",
    "mirror) · erised-sequencer",
    "(the rewindable engine, vendored unmodified @ `b8c0c3d8`) ·",
    "erised-fleet-table (the",
    "fleet playtest) · **this repo: the exocortex layer** (wave 66, directive layer F)."
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
  "scanned_files": 3,
  "law_statements": [
    {
      "ref": "README.md:14",
      "text": "## The three laws"
    },
    {
      "ref": "README.md:16",
      "text": "| law | what it says | where it lives |"
    },
    {
      "ref": "README.md:19",
      "text": "| **DEADBAND** | inside an ExoJ's envelope the beat costs **zero thought-tokens** — the script plays, the dice are mech…"
    },
    {
      "ref": "README.md:98",
      "text": "The same three laws describe the fleet's own lane discipline: state-first,"
    },
    {
      "ref": "README.md:124",
      "text": "Keys live in `/home/z/my-project/.env.keys` (chmod 600, gitignored, never"
    },
    {
      "ref": "README.md:135",
      "text": "repair is receipted as `scar` ops, never silent. The story honors every"
    },
    {
      "ref": "README.md:138",
      "text": "breach is exactly such a tie-break — a law working as written, and the table"
    },
    {
      "ref": "README.md:139",
      "text": "chose to keep the wound rather than patch the law mid-campaign."
    },
    {
      "ref": "DESIGN.md:3",
      "text": "Zero-shot design (written before the code, fleet law). Wave 66, layer F."
    },
    {
      "ref": "DESIGN.md:18",
      "text": "## The three laws"
    },
    {
      "ref": "DESIGN.md:28",
      "text": "mechanically, and the platonic dice are mechanical too (the Risk law:"
    },
    {
      "ref": "DESIGN.md:34",
      "text": "are **sticky** (erised scar law: a breach teaches; the scar survives rewind)."
    },
    {
      "ref": "DESIGN.md:36",
      "text": "## The economics (the thesis the campaign must receipt)"
    },
    {
      "ref": "DESIGN.md:49",
      "text": "So the receipt of record must show: thought-tokens per night FALL on routine"
    },
    {
      "ref": "DESIGN.md:109",
      "text": "| Kestrel | ranger | Nemotron-3.5-Lightning | clipped, counts things, \"never surprised twice\" |"
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

