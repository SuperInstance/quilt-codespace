# 🌐 Quilt Codespace

> A GitHub Codespace that runs Quilt as a live, token-authenticated, federated runtime. TUI in the browser. HTTP API for IoT. Subscribes to siblings.

[![tier](https://img.shields.io/badge/tier-codespace-blueviolet)](.)
[![license](https://img.shields.io/badge/license-Apache--2.0-blue)](.)
[![patterns](https://img.shields.io/badge/pattern-agent--workspace--template-green)](.)

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub Codespace                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ ttyd :7681  │  │ HTTP :4096   │  │ Dashboard :8080  │  │
│  │ (TUI)       │  │ (MCP / SSE)  │  │ (federation UI)  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│           │              │                │               │
│           └──────────────┴────────────────┘               │
│                          │                                │
│                  Quilt Engine (this Codespace)            │
│                          │                                │
│                          │  subscribes to                 │
└──────────────────────────┼────────────────────────────────┘
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
  ┌─────────┐         ┌─────────┐         ┌─────────┐
  │ ESP32   │         │ Jetson  │         │ Cloud   │
  │ sensors │         │ vision  │         │ audit   │
  │ motors  │         │ LLM     │         │ replay  │
  └─────────┘         └─────────┘         └─────────┘
```

## Quick start

1. **Use this template** on GitHub → **"Open in Codespace"**
2. Wait 2-3 minutes for the post-create script to finish
3. The terminal shows three URLs and a runtime token. Save the token.
4. Hit the HTTP API from anywhere:

```bash
curl -H "Authorization: Bearer $QUILT_TOKEN" \
     https://YOUR-CODESPACE-4096.githubpreview.dev/cells/local/fed-autopilot/demo.greeting
```

5. Subscribe to a cell via SSE:

```bash
curl -N -H "Authorization: Bearer $QUILT_TOKEN" \
     https://YOUR-CODESPACE-4096.githubpreview.dev/cells/local/fed-autopilot/remote.rudder_angle/events
```

## What ships

| Service | Port | What it does |
|---|---|---|
| **TUI** (ttyd) | 7681 | Browser-based terminal running `quilt serve` |
| **HTTP API** | 4096 | REST + SSE for cell get/set/subscribe |
| **Dashboard** | 8080 | Static landing page with the federation view |

The HTTP API is a self-contained Node script (`scripts/quilt-http-server.js`) that exposes a Quilt engine over HTTP. It's the bridge between the in-process engine and the outside world.

## Federation

This repo is a **Quilt tier**. The Quilt ecosystem is federated — multiple Quilt instances (Codespace, Jetson, ESP32, Cloudflare Worker) talk to each other via the URI scheme `quilt://[instance]/[sheet]#[cell]`. See:

- [The federation landing page](https://superinstance.github.io/quilt/landing/federation.html) — full architecture
- [The agent-substrate page](https://superinstance.github.io/quilt/landing/agent-substrate.html) — 5 primitives
- [`@quilt/sdk` `resolveCell` and `subscribeCell`](https://github.com/SuperInstance/quilt/tree/main/packages/sdk) — the federation API

## The fed-autopilot example

`examples/fed-autopilot/cell.yaml` is a 3-tier Quilt stack:

| Tier | Quilt | What it does |
|---|---|---|
| **ESP32** (tight loop) | `quilt-esp32` | Sensors (rudder, compass), actuators (motor), local PID |
| **Jetson** (mid-tier) | `quilt-jetson` (next) | Vision (obstacles, wind), local LLM |
| **Codespace** (brain) | this repo | Higher reasoning (anomaly score), tuning, audit |

The codespace subscribes to:
- `quilt://esp32-fleet/boat#sensor.rudder` and `#sensor.compass`
- `quilt://jetson-lab/perception#vision.wind` and `#vision.obstacles`

And pushes back:
- `quilt://esp32-fleet/boat#algo.pid_kp` and friends (PID tunables)
- `quilt://cloud-fleet/audit#autopilot.last_decision` (audit trail)

Same reactive engine, same cell semantics, three different hardware tiers. **Federation is just a subscription.**

## Persistent state

The Codespace stores its state in `~/.quilt/state/`. When the Codespace shuts down, that state is lost (Codespaces are ephemeral). To persist across sessions:

- The state is written to `~/.quilt-env` (token) and `seed.json` (initial cells)
- For long-lived state, sync to a Quilt running on a persistent tier (Cloudflare, server, cloud Quilt)

## Tier auto-detection

`@quilt/sdk`'s `detectTier()` returns:

```js
{
  tier: 'codespace',
  instanceId: 'codespace-abc123',
  platform: 'GitHub Codespace (Linux container)',
  capabilities: { async: true, network: true, llmApi: true, gpu: false },
  siblings: ['jetson', 'cloudflare', 'server']
}
```

Override with `QUILT_TIER=...` or `QUILT_INSTANCE_ID=...` env vars.

## Patterns adapted from the ecosystem

This template follows the same shape as:

- [`SuperInstance/agent-workspace-template`](https://github.com/SuperInstance/agent-workspace-template) — the `devcontainer.json` + `post-create.sh` pattern
- [`SuperInstance/codespace-worker`](https://github.com/SuperInstance/codespace-worker) — Codespace as a runtime
- [`SuperInstance/cocapn-runtime`](https://github.com/SuperInstance/cocapn-runtime) — the 5-tier deployment model (BareRoom → EdgeRoom → CodespaceRoom → SandboxRoom → Lighthouse)

For Quilt, the tiers map to:

| Cocapn room | Quilt tier | Repo |
|---|---|---|
| BareRoom (no_std) | `esp32` | [`quilt-esp32`](https://github.com/SuperInstance/quilt-esp32) |
| EdgeRoom (sync + alloc) | `jetson` | (next) |
| CodespaceRoom (async) | `codespace` | this repo |
| SandboxRoom (resource-limited) | `cloudflare` | [`quilt-cloudflare`](https://github.com/SuperInstance/quilt-cloudflare) |
| Lighthouse (always-on) | `codespace` persistent | this repo + external storage |

## Scripts

- `scripts/quilt-http-server.js` — the HTTP API (in-process engine, file-backed state)
- `.devcontainer/post-create.sh` — auto-installs deps, starts services, prints URLs

## Cross-references

- [`quilt` core](https://github.com/SuperInstance/quilt) — the engine + SDK + CLI
- [`@quilt/sdk`](https://github.com/SuperInstance/quilt/tree/main/packages/sdk) — 5 primitives + federation
- [`quilt-esp32`](https://github.com/SuperInstance/quilt-esp32) — the edge tier
- [`quilt-cloudflare`](https://github.com/SuperInstance/quilt-cloudflare) — the edge cloud tier
- [Federation landing page](https://superinstance.github.io/quilt/landing/federation.html)
- [Quilt ecosystem](https://superinstance.github.io/quilt/) — overview

## License

Apache 2.0
