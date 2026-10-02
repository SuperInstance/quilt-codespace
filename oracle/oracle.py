#!/usr/bin/env python3
"""oracle.py — the deterministic repo-oracle for quilt-codespace (wave-66).

An internal callable git-agent component: it knows THIS repo by having
decomposed it for itself (repo-map: tree + symbols + heat + receipts), and
answers questions / drafts fix plans from that decomposition — no network,
no keys, no model. The expert-coder loop lives in fix-loop.sh; every action
here is a receipted op on a sha256 chain (the custody law: verify or refuse).

Commands:
  build                     scan repo -> .quilt/repo-map/ + seed receipts
  where <symbol>            locate symbol occurrences (files + line numbers)
  what <path>               describe a file from the map (symbols, heat, neighbors)
  hot [n]                   top-n files by recent commit heat
  touching <symbol>         files whose symbols mention <symbol>
  plan <text>               draft a DECOMPOSITION-draft.md cell graph for an issue
  ask <question>            route a question to the best command (token scoring)
  receipt <op> <json>       append an op receipt to the chain
  verify                    verify the receipt chain (fail-closed, named errors)
  serve [--port 4097]       HTTP JSON API: /health /map /ask?q= /symbol/<n> /heat

Design doctrine (ORACLE.md): every agent edit should be a quilt tick; this
oracle is the deterministic membrane that makes the repo legible to whoever
(or whatever) is holding the tools. Swap-in upgrade path: quilt-in-git's
hooks replace the receipt emitter for full tick semantics.
"""
import json, hashlib, os, re, subprocess, sys, time
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAPDIR = os.path.join(ROOT, ".quilt", "repo-map")
RECEIPTS = os.path.join(ROOT, ".quilt", "oracle-receipts.jsonl")
STOP = set("the a an of for in on to is are and or what where which who how does do with from this that".split())

# ---------------------------------------------------------------- receipts --
def _canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"))

def chain_append(op, payload, path=RECEIPTS):
    rows = chain_load(path)
    prev = rows[-1]["tip"] if rows else "genesis"
    row = {"seq": len(rows) + 1, "op": op, "payload": payload,
           "at": int(time.time()), "prev": prev}
    row["tip"] = hashlib.sha256(
        f"{row['seq']}|{op}|{_canon(payload)}|{prev}".encode()).hexdigest()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a") as f:
        f.write(_canon(row) + "\n")
    return row

def chain_load(path=RECEIPTS):
    if not os.path.exists(path):
        return []
    return [json.loads(l) for l in open(path) if l.strip()]

def chain_verify(path=RECEIPTS):
    rows = chain_load(path)
    prev = "genesis"
    for r in rows:
        want = hashlib.sha256(
            f"{r['seq']}|{r['op']}|{_canon(r['payload'])}|{prev}".encode()).hexdigest()
        if r["prev"] != prev:
            return {"ok": False, "error": "CUSTODY_GAP", "seq": r["seq"]}
        if r["tip"] != want:
            return {"ok": False, "error": "RECEIPT_HASH_MISMATCH", "seq": r["seq"]}
        prev = r["tip"]
    return {"ok": True, "rows": len(rows), "tip": prev}

# ---------------------------------------------------------------- repo-map --
CODE_SYMS = {
    ".py":  r"^(?:def|class)\s+([A-Za-z_]\w*)",
    ".js":  r"^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=",
    ".mjs": r"^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=",
    ".ts":  r"^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*[:=]",
    ".sh":  r"^([A-Za-z_]\w*)\s*\(\)\s*\{",
}

def build():
    os.makedirs(MAPDIR, exist_ok=True)
    tree, symbols = [], {}
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules", ".quilt")]
        for fn in filenames:
            p = os.path.join(dirpath, fn)
            rel = os.path.relpath(p, ROOT)
            ext = os.path.splitext(fn)[1]
            try:
                size = os.path.getsize(p)
            except OSError:
                continue
            tree.append({"path": rel, "size": size})
            if ext in CODE_SYMS and size < 400_000:
                try:
                    for i, line in enumerate(open(p, errors="replace"), 1):
                        for m in re.finditer(CODE_SYMS[ext], line):
                            name = next((g for g in m.groups() if g), None)
                            if name:
                                symbols.setdefault(name, []).append(
                                    {"path": rel, "line": i})
                except OSError:
                    pass
    heat = {}
    try:
        out = subprocess.run(
            ["git", "log", "--name-only", "--pretty=format:%x00", "-n", "300"],
            cwd=ROOT, capture_output=True, text=True, timeout=30).stdout
        for block in out.split("\x00"):
            for f in block.strip().splitlines():
                f = f.strip()
                if f:
                    heat[f] = heat.get(f, 0) + 1
    except Exception:
        pass
    with open(f"{MAPDIR}/tree.json", "w") as f:
        json.dump(sorted(tree, key=lambda x: x["path"]), f, indent=1)
    with open(f"{MAPDIR}/symbols.json", "w") as f:
        json.dump(symbols, f, indent=1)
    with open(f"{MAPDIR}/heat.json", "w") as f:
        json.dump(heat, f, indent=1)
    row = chain_append("build.repo-map", {
        "files": len(tree), "symbols": len(symbols), "heat_files": len(heat)})
    return {"files": len(tree), "symbols": len(symbols), "heat_files": len(heat),
            "receipt": row["tip"][:12]}

def _load(name):
    p = f"{MAPDIR}/{name}"
    return json.load(open(p)) if os.path.exists(p) else None

# ---------------------------------------------------------------- queries --
def where(sym):
    s = _load("symbols.json") or {}
    hits = s.get(sym, [])
    if not hits:  # substring fallback
        hits = [h for k, v in s.items() if sym.lower() in k.lower() for h in v]
    chain_append("ask.where", {"symbol": sym, "hits": len(hits)})
    return {"symbol": sym, "occurrences": hits[:20], "count": len(hits)}

def hot(n=10):
    h = _load("heat.json") or {}
    top = sorted(h.items(), key=lambda kv: -kv[1])[: int(n)]
    return {"hot": [{"path": p, "commits": c} for p, c in top]}

def what(path):
    tree = _load("tree.json") or []
    s = _load("symbols.json") or {}
    h = _load("heat.json") or {}
    entry = next((t for t in tree if t["path"] == path), None)
    if not entry:
        cands = [t["path"] for t in tree if path.lower() in t["path"].lower()][:10]
        return {"error": "PATH_NOT_IN_MAP", "candidates": cands}
    syms = [k for k, v in s.items() if any(x["path"] == path for x in v)]
    d, base = os.path.split(path)
    neighbors = [t["path"] for t in tree
                 if os.path.dirname(t["path"]) == d and t["path"] != path][:8]
    return {"path": path, "size": entry["size"], "symbols": syms,
            "heat": h.get(path, 0), "neighbors": neighbors}

def touching(sym):
    s = _load("symbols.json") or {}
    files = sorted({x["path"] for k, v in s.items()
                    if sym.lower() in k.lower() for x in v})
    return {"symbol": sym, "files": files}

# ---------------------------------------------------------------- planning --
def plan(text):
    tokens = [t for t in re.findall(r"\w+", text.lower())
              if t not in STOP and len(t) > 2]
    s = _load("symbols.json") or {}
    tree = _load("tree.json") or []
    h = _load("heat.json") or {}
    scored = {}
    for t in tokens:
        for k in s:
            if t in k.lower():
                for x in s[k]:
                    scored[x["path"]] = scored.get(x["path"], 0) + 3
        for tr in tree:
            if t in tr["path"].lower():
                scored[tr["path"]] = scored.get(tr["path"], 0) + 1
    for p in list(scored):
        scored[p] += h.get(p, 0)  # heat as rerank
    ranked = sorted(scored.items(), key=lambda kv: -kv[1])[:5]
    steps, i = [], 0
    if ranked:
        i += 1
        steps.append({"id": "c1", "kind": "LOCATE",
                      "detail": f"confirm scope in {ranked[0][0]}",
                      "depends_on": []})
        for p, _ in ranked[:3]:
            i += 1
            steps.append({"id": f"c{i}", "kind": "EDIT",
                          "detail": f"apply change in {p}", "depends_on": [f"c{i-1}"]})
            i += 1
            steps.append({"id": f"c{i}", "kind": "TEST",
                          "detail": f"exercise change touching {p}",
                          "depends_on": [f"c{i-1}"]})
        i += 1
        steps.append({"id": f"c{i}", "kind": "RECEIPT",
                      "detail": "commit as tick; receipt appended",
                      "depends_on": [f"c{i-1}"]})
    out = {"issue": text, "cells": steps}
    draft = os.path.join(ROOT, "oracle", "DECOMPOSITION-draft.md")
    with open(draft, "w") as f:
        f.write(f"# Decomposition draft — {text}\n\n")
        f.write("_Generated by oracle.py from the repo-map. Amend, don't obey: "
                "the why of every amendment belongs in the adjustments ledger._\n\n")
        f.write("| cell | kind | detail | depends on |\n|---|---|---|---|\n")
        for c in steps:
            f.write(f"| {c['id']} | {c['kind']} | {c['detail']} | "
                    f"{', '.join(c['depends_on']) or '—'} |\n")
    chain_append("plan.draft", {"issue": text[:200], "cells": len(steps)})
    return {"draft": os.path.relpath(draft, ROOT), "cells": steps}

def ask(q):
    toks = [t for t in re.findall(r"\w+", q.lower()) if t not in STOP]
    s = _load("symbols.json") or {}
    if not toks:
        return {"error": "EMPTY_QUESTION"}
    best, score = None, 0
    for t in toks:
        if t in s:
            score = len(s[t])
            best = t
            break
    if best and any(w in q.lower() for w in ("where", "find", "locate")):
        return where(best)
    if any(w in q.lower() for w in ("hot", "active", "recent", "changed")):
        return hot()
    if any(w in q.lower() for w in ("what", "describe", "explain")) and best:
        for x in s.get(best, [])[:1]:
            return what(x["path"])
    if best:
        return touching(best)
    return {"error": "NO_MATCH", "hint": "try: where <symbol> | hot | what <path>"}

# ---------------------------------------------------------------- serving --
def serve(port):
    from http.server import BaseHTTPRequestHandler, HTTPServer
    class H(BaseHTTPRequestHandler):
        def _send(self, code, obj):
            body = json.dumps(obj, indent=1).encode()
            self.send_response(code)
            self.send_header("content-type", "application/json")
            self.send_header("content-length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        def do_GET(self):
            u = urlparse(self.path)
            q = parse_qs(u.query)
            try:
                if u.path == "/health":
                    v = chain_verify()
                    return self._send(200, {"status": "ready", "chain": v})
                if u.path == "/map":
                    return self._send(200, {"tree": len(_load("tree.json") or []),
                                            "symbols": len(_load("symbols.json") or {})})
                if u.path == "/ask":
                    return self._send(200, ask((q.get("q") or [""])[0]))
                if u.path.startswith("/symbol/"):
                    return self._send(200, where(u.path.rsplit("/", 1)[1]))
                if u.path == "/heat":
                    return self._send(200, hot(15))
                return self._send(404, {"error": "NOT_FOUND"})
            except Exception as e:
                return self._send(500, {"error": "ORACLE_FAULT", "detail": str(e)[:200]})
        def log_message(self, *a):
            pass
    chain_append("serve.start", {"port": port})
    print(f"oracle serving on :{port}")
    HTTPServer(("0.0.0.0", port), H).serve_forever()

# ---------------------------------------------------------------- main ------
def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    cmd, args = sys.argv[1], sys.argv[2:]
    if cmd == "build":
        print(json.dumps(build(), indent=1))
    elif cmd == "where":
        print(json.dumps(where(args[0]), indent=1))
    elif cmd == "what":
        print(json.dumps(what(args[0]), indent=1))
    elif cmd == "hot":
        print(json.dumps(hot(args[0] if args else 10), indent=1))
    elif cmd == "touching":
        print(json.dumps(touching(args[0]), indent=1))
    elif cmd == "plan":
        print(json.dumps(plan(" ".join(args)), indent=1))
    elif cmd == "ask":
        print(json.dumps(ask(" ".join(args)), indent=1))
    elif cmd == "receipt":
        print(json.dumps(chain_append(args[0], json.loads(args[1])), indent=1))
    elif cmd == "verify":
        print(json.dumps(chain_verify(), indent=1))
    elif cmd == "serve":
        port = int(args[args.index("--port") + 1]) if "--port" in args else 4097
        serve(port)
    else:
        print(f"unknown command {cmd}", file=sys.stderr)
        return 2
    return 0

if __name__ == "__main__":
    sys.exit(main())
