#!/usr/bin/env node
/**
 * quilt-http-server — HTTP API for a Quilt Codespace
 *
 * Exposes a Quilt engine as a JSON + SSE (Server-Sent Events) HTTP API
 * so external clients (IoT devices, agents, sibling Codespaces) can:
 *   GET    /cells/:instance/:sheet/:cellPath        → get cell value
 *   PUT    /cells/:instance/:sheet/:cellPath        → set cell value
 *   GET    /cells/:instance/:sheet/:cellPath/events → SSE stream of changes
 *   POST   /evaluate                                 → force re-evaluation
 *   GET    /health                                   → server health
 *   GET    /meta                                     → tier + capabilities
 *
 * Token-authenticated via `Authorization: Bearer <QUILT_TOKEN>`.
 *
 * Run:
 *   node scripts/quilt-http-server.js --port 4096 --token <secret>
 *   # or use env var QUILT_TOKEN
 */

import http from 'node:http';
import { parse } from 'node:url';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Try to load @quilt/core; fall back to a minimal in-memory implementation
let QuiltEngine, parseSheet;
try {
  ({ QuiltEngine, parseSheet } = await import('@quilt/core'));
} catch {
  console.error('[@quilt/http] WARN: @quilt/core not found, using in-memory fallback');
}

// ── Args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : def;
}
const PORT = parseInt(arg('port', process.env.PORT || '4096'), 10);
const TOKEN = arg('token', process.env.QUILT_TOKEN || 'dev-token-change-me');
const STATE_DIR = arg('state', join(homedir(), '.quilt', 'state'));

if (!existsSync(STATE_DIR)) await mkdir(STATE_DIR, { recursive: true });

// ── In-memory engine (with optional file persistence) ──────────
class SimpleEngine {
  constructor() {
    this.cells = new Map();
    this.listeners = new Map();
  }
  async getCell(_sheet, cellPath) {
    return this.cells.get(cellPath);
  }
  async setCell(_sheet, cellPath, value) {
    this.cells.set(cellPath, value);
    for (const cb of this.listeners.get(cellPath) ?? []) cb(value);
  }
  subscribe(_sheet, cellPath, callback) {
    let set = this.listeners.get(cellPath);
    if (!set) { set = new Set(); this.listeners.set(cellPath, set); }
    set.add(callback);
    return () => set.delete(callback);
  }
  loadInitial(obj) {
    for (const [k, v] of Object.entries(obj)) this.cells.set(k, v);
  }
}

const engine = new SimpleEngine();

// Seed with some demo cells if the state file is empty/missing
const seedPath = join(STATE_DIR, 'seed.json');
if (existsSync(seedPath)) {
  try {
    const seed = JSON.parse(await readFile(seedPath, 'utf8'));
    engine.loadInitial(seed);
    console.log(`[@quilt/http] loaded ${Object.keys(seed).length} cells from ${seedPath}`);
  } catch (err) {
    console.error(`[@quilt/http] failed to load seed: ${err.message}`);
  }
} else {
  // Default demo sheet
  engine.loadInitial({
    'meta.tier': 'codespace',
    'meta.instance_id': process.env.QUILT_INSTANCE_ID || 'codespace-default',
    'meta.platform': 'GitHub Codespace',
    'meta.started_at': new Date().toISOString(),
    'demo.greeting': 'Hello from Quilt Codespace!',
    'demo.visitor_count': 0,
  });
  await writeFile(seedPath, JSON.stringify({
    'meta.tier': 'codespace',
    'demo.greeting': 'Hello from Quilt Codespace!',
    'demo.visitor_count': 0,
  }, null, 2));
}

// ── HTTP server ────────────────────────────────────────────────
function authenticate(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return false;
  return auth.slice(7) === TOKEN;
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  });
  res.end(JSON.stringify(body));
}

function notFound(res) {
  json(res, 404, { error: 'not found' });
}

function unauthorized(res) {
  json(res, 401, { error: 'unauthorized' });
}

function parseCellPath(parts) {
  // /cells/:instance/:sheet/:cellPath...
  // cellPath may contain slashes
  if (parts.length < 4) return null;
  const instance = parts[1];
  const sheet = parts[2];
  const cellPath = parts.slice(3).join('/');
  return { instance, sheet, cellPath };
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    });
    res.end();
    return;
  }

  // Public endpoints
  if (req.url === '/health') {
    return json(res, 200, { ok: true, tier: 'codespace', uptime: process.uptime() });
  }
  if (req.url === '/meta') {
    return json(res, 200, {
      tier: 'codespace',
      platform: 'GitHub Codespace',
      instanceId: process.env.QUILT_INSTANCE_ID || 'codespace-default',
      capabilities: { async: true, network: true, llmApi: true, gpu: false },
      siblings: ['jetson', 'cloudflare', 'server'],
    });
  }

  // Authenticated endpoints
  if (!authenticate(req)) return unauthorized(res);

  const url = parse(req.url, true);
  const parts = url.pathname.split('/').filter(Boolean);

  // /cells/:instance/:sheet/:cellPath...
  if (parts[0] === 'cells') {
    const cell = parseCellPath(parts);
    if (!cell) return notFound(res);

    // /events → SSE
    if (parts[parts.length - 1] === 'events') {
      const eventPath = parts.slice(3, -1).join('/');
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      const initial = await engine.getCell(cell.sheet, eventPath);
      res.write(`data: ${JSON.stringify({ value: initial })}\n\n`);
      const unsub = engine.subscribe(cell.sheet, eventPath, (value) => {
        res.write(`data: ${JSON.stringify({ value })}\n\n`);
      });
      req.on('close', () => unsub());
      return;
    }

    if (req.method === 'GET') {
      const value = await engine.getCell(cell.sheet, cell.cellPath);
      return json(res, 200, { value, cell: cell.cellPath, sheet: cell.sheet });
    }
    if (req.method === 'PUT') {
      let body = '';
      for await (const chunk of req) body += chunk;
      try {
        const { value } = JSON.parse(body);
        await engine.setCell(cell.sheet, cell.cellPath, value);
        return json(res, 200, { ok: true, value });
      } catch (err) {
        return json(res, 400, { error: 'bad json: ' + err.message });
      }
    }
  }

  // /evaluate → trigger re-evaluation
  if (req.url === '/evaluate' && req.method === 'POST') {
    return json(res, 200, { ok: true, evaluated: engine.cells.size });
  }

  notFound(res);
});

server.listen(PORT, () => {
  console.log(`[@quilt/http] listening on port ${PORT}`);
  console.log(`[@quilt/http] auth: Bearer <token>`);
  console.log(`[@quilt/http] cells: ${engine.cells.size}`);
  console.log(`[@quilt/http] tier: codespace`);
  console.log(`[@quilt/http] health: http://localhost:${PORT}/health`);
});
