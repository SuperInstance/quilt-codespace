# quilt-codespace — CTO Brief

## One-paragraph value statement

quilt-codespace turns a free GitHub Codespace into a live, token-authenticated Quilt
runtime — browser TUI, HTTP+SSE cell API, federation dashboard — that IoT devices,
agents, and sibling tiers can address from anywhere via `quilt://` URIs; and it proves a
second, bigger idea in the same repo: a deterministic "repo oracle" that answers
provenance and structure questions about any repository from that repo's own records
(git history, ledgers, laws) with a full evidence trail, no network, no keys, no model.
Together they demonstrate the fleet's two cheapest expansions: always-on runtime capacity
at zero infra cost, and trustworthy repo intelligence without an LLM in the loop.

## What it does & for whom

For agent-lane operators: a one-click Codespace template that boots three services and
prints their URLs plus a bearer token. For external devices/agents: a REST+SSE cell API
(get/set/subscribe) with the fleet's federation addressing. For anyone auditing a repo:
two oracle tools — `oracle/oracle.py` (in-repo map, plan drafts, receipt-chain custody,
fix-loop) and `tools/repo-oracle.mjs` (13-probe read-only battery over any repo, with
saved transcripts in `docs/oracle-sessions/`). For the fleet's research program: the
working artifact behind the reflex/reflect doctrine (deterministic oracle under,
model above) that the wave-74/75 studies later quantified at the account level.

## Maturity assessment

**Working prototype, honest about its boundary.** Evidence: the HTTP server has a green
CI smoke (boot → /health → /meta) on every push; the oracle's pins are fail-first and
include tamper + custody-gap refusals (`self-test.sh` P0–P9); the portable oracle's
self-test is 12/12 and it has four real transcripts against fleet repos; the fix-loop
runs end-to-end on a bundled real fixture (T1). Not yet proven: the two-agent pipeline
(design-only, explicitly parked in `docs/two-agent-pipeline.md` and ORACLE.md's
"proven vs parked"), quilt-in-git tick-engine swap (T3), and repo-map freshness TTL. The
runtime's `@quilt/core` integration degrades gracefully to a key-value engine when the
upstream package is absent.

## Risks

| Risk | Severity | Mitigation status |
|---|---|---|
| Token printed to boot terminal + stored plaintext in `~/.quilt-env` | Medium (single-tenant context) | Accepted and documented; token is per-boot, per-Codespace, never committed; `.gitignore` blocks `.env*`. No rotation story yet |
| Default token `dev-token-change-me` if started bare | Medium for remote use | Local-only pattern; post-create always generates a real one on the Codespace path |
| Public `/health` + `/meta` | Low | By design (sibling discovery); no cell data in either response |
| Fallback engine silently lacks formula/AI semantics | Medium (expectation gap) | Loud startup warning + docs; upstream install tolerated-failure is visible in boot log |
| Ephemeral state loss on Codespace rebuild | Medium | Documented; persistence belongs to durable tiers (Cloudflare/server) — out of scope here |
| Codespace provisioning variance (free tier) | Low | Receipted at ~11 min (wave-50); driver polls up to 5 min then times out — a known window mismatch, delete-and-retry is the runbook |
| No secrets hygiene issue found in review | — | Key-scan posture: no token/key material anywhere in the tree (this doc wave re-checked) |

## Cost profile

Free-tier end to end: Codespaces basicLinux32gb (public repo), GitHub Actions smoke on
push, zero external services, zero model calls in the oracle loop (law 3). The only
nonzero line item in the repo's history is human/agent time; the wave-50 journal
receipted the codespace lane at $0 API spend. Scaling to many concurrent Codespaces is a
GitHub billing decision, not an architecture change (each is self-contained).

## Strategic options

- **Invest**: the oracle layer is the differentiator — finish T2 (wire oracle `/ask` into
  the HTTP `/meta` discovery surface) and run the two-agent pipeline once end-to-end;
  both are small, receipt-gated steps with outsized doctrine value.
- **Maintain (current posture)**: the template works; CI keeps it honest; the oracle pins
  guard custody. Zero ongoing cost.
- **Harvest-learnings**: the read-only probe battery + evidence-trail answer format is
  directly reusable as a due-diligence instrument for any external repo (dog-food lane);
  the fix-loop's claim/lease/why-ledger is a reusable agent-process pattern.
- **Retire**: not indicated — the repo is the codespace tier of the federation and the
  receipted ancestor of the fleet's codespace tooling (`codespace-worker.sh` forked its
  one-shot pattern into `driver/oracle-worker.sh`).

## Integration surface

Depends on: upstream `quilt` runtime (npm packages, optional at boot), GitHub Codespaces
infra, `gh` CLI (driver only). Consumed by: federation siblings (`quilt-esp32`,
`quilt-cloudflare`, planned jetson tier) via `quilt://` URIs; agents via the HTTP/SSE API
and the oracle CLI/HTTP surfaces; the fleet journal (waves 49/50 provisioning receipts).
Feeds forward: `driver/oracle-worker.sh` documents `codespace-worker` as its fork parent;
`oracle/TASKS.md`'s T3 names quilt-in-git hooks as the upgrade path for tick semantics.
No repo in the fleet hard-depends on this one being alive — the dependency direction is
this repo reaching out, which keeps its blast radius local.
