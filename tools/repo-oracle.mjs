#!/usr/bin/env node
/**
 * repo-oracle.mjs — the portable repo-oracle (task 66-d, wave-66).
 *
 * A sibling of oracle/oracle.py with a different center of gravity:
 *   oracle.py decomposes the CURRENT TREE of this repo (repo-map: symbols, heat);
 *   this tool interrogates any repo's OWN RECORDS — history, logs, receipts,
 *   ledgers, READMEs — and answers WITH the trail, not just the answer.
 *
 *   "logic decomposed by him for him": the repo is the oracle. Every probe is a
 *   deterministic read of what the repo already says about itself (git log,
 *   ls-files, ledger files, key-file summaries). No network, no keys, no model.
 *   The model wrap is a layer above — that IS the PoC point: how much of an
 *   'oracle' is just disciplined git reading?
 *
 * READ-ONLY BY LAW: the only git verbs ever invoked are rev-parse, log,
 * ls-files, branch, tag, status --porcelain. No add/commit/push/checkout.
 * No file under the target repo is written.
 *
 * Usage:
 *   node tools/repo-oracle.mjs ask <repo-path> "<question>" [--json] [--save <dir>]
 *   node tools/repo-oracle.mjs self-test [--json]
 *
 * Output shape (JSON): { question, repo, head, focus,
 *                        evidence: [{probe, finding}], decomposition, answer }
 */

import { execFileSync } from "node:child_process";
import { readFileSync, statSync, mkdirSync, writeFileSync, rmSync, mkdtempSync, existsSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// --------------------------------------------------------------- utilities --

const die = (code, name, msg) => {
  process.stderr.write(JSON.stringify({ error: name, message: msg }) + "\n");
  process.exit(code);
};

function git(repo, ...args) {
  // execFileSync (no shell) — every argument is fixed by this file, never the question.
  // stderr is captured, not echoed: probe failures become named findings, not noise.
  try {
    return execFileSync("git", ["-C", repo, ...args], {
      maxBuffer: 32 * 1024 * 1024,
      timeout: 20000,
      stdio: ["ignore", "pipe", "pipe"],
    }).toString();
  } catch (e) {
    const why = ((e.stderr && e.stderr.toString()) || e.message || "git failed").trim().split("\n")[0];
    const err = new Error(why);
    err.stderr = why;
    throw err;
  }
}

const cap = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const oneLine = (s) => s.replace(/\s+/g, " ").trim();
const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "q";
const uniqSorted = (a) => [...new Set(a)].sort();

function headLines(path, n) {
  try {
    const raw = readFileSync(path, "utf8");
    return raw.split(/\r?\n/).slice(0, n).filter((l) => l.trim().length > 0)
      .map((l) => cap(oneLine(l.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")), 140));
  } catch { return []; }
}

// ------------------------------------------------------------------ battery --
// The FIXED battery. Every probe runs on every ask, in this order, read-only.
// A probe returns a finding object; findings may be honest nulls (e.g. no tags).

const PROBES = [
  {
    name: "git.identity",
    why: "anchor: which repo state is being spoken about",
    run(repo) {
      const head = git(repo, "rev-parse", "HEAD").trim();
      const branch = git(repo, "rev-parse", "--abbrev-ref", "HEAD").trim();
      const subject = oneLine(git(repo, "log", "-1", "--format=%s").trim());
      const date = git(repo, "log", "-1", "--format=%cI").trim();
      let remote = "none";
      try {
        const urls = git(repo, "remote", "get-url", "origin").trim();
        remote = urls.replace(/https:\/\/[^@/]+@/, "https://<scrubbed>@");
      } catch { /* no origin */ }
      return { head, branch, subject, date, remote };
    },
  },
  {
    name: "git.log.recent",
    why: "recency slice: the last thing this repo did",
    run(repo) {
      const lines = git(repo, "log", "-12", "--format=%h%x09%an%x09%cI%x09%s").trim().split("\n").filter(Boolean);
      const count = git(repo, "rev-list", "--count", "HEAD").trim();
      return { total_commits: Number(count), recent: lines.map((l) => { const [h, a, d, ...s] = l.split("\t"); return { sha: h, author: a, date: d, subject: cap(s.join("\t"), 110) }; }) };
    },
  },
  {
    name: "git.log.genesis",
    why: "ancestry: where the repo came from",
    run(repo) {
      const roots = git(repo, "rev-list", "--max-parents=0", "HEAD").trim().split("\n").filter(Boolean);
      const first = git(repo, "log", "--reverse", "--format=%h%x09%cI%x09%s", "HEAD").trim().split("\n")[0] || "";
      const [sha, date, ...sub] = first.split("\t");
      return { roots, first_commit: { sha, date, subject: cap(sub.join("\t"), 110) } };
    },
  },
  {
    name: "git.authors",
    why: "who wrote the record",
    run(repo) {
      const names = git(repo, "log", "--format=%an").split("\n").filter(Boolean);
      const tally = {};
      for (const n of names) tally[n] = (tally[n] || 0) + 1;
      const authors = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 6)
        .map(([name, commits]) => ({ name, commits }));
      return { distinct_authors: Object.keys(tally).length, top: authors };
    },
  },
  {
    name: "git.heat",
    why: "which files carry the history (commit touches)",
    run(repo) {
      const out = git(repo, "log", "--name-only", "--pretty=format:", "-400");
      const tally = {};
      for (const p of out.split("\n").map((s) => s.trim()).filter(Boolean)) tally[p] = (tally[p] || 0) + 1;
      const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([path, touches]) => ({ path, touches }));
      return { touched_paths: Object.keys(tally).length, hottest: top };
    },
  },
  {
    name: "census.files",
    why: "inventory: what the tree is made of",
    run(repo) {
      const files = git(repo, "ls-files").split("\n").filter(Boolean);
      const ext = {};
      const dirs = {};
      for (const f of files) {
        const m = f.match(/\.([A-Za-z0-9]+)$/);
        if (m) ext[m[1].toLowerCase()] = (ext[m[1].toLowerCase()] || 0) + 1;
        const key = f.includes("/") ? f.split("/").slice(0, 2).join("/") : "(root)";
        dirs[key] = (dirs[key] || 0) + 1;
      }
      const byExt = Object.entries(ext).sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([extension, count]) => ({ extension, count }));
      const byDir = Object.entries(dirs).sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([dir, count]) => ({ dir, count }));
      return { tracked_files: files.length, by_extension: byExt, top_dirs: byDir };
    },
  },
  {
    name: "census.docs",
    why: "where the repo writes prose about itself",
    run(repo) {
      const docs = git(repo, "ls-files", "*.md", "*.rst", "*.txt").split("\n").filter(Boolean);
      const readmes = uniqSorted(docs.filter((d) => /(^|\/)readme/i.test(d)));
      return { doc_files: docs.length, readmes, docs_sample: docs.slice(0, 18) };
    },
  },
  {
    name: "ledger.receipts",
    why: "detect the repo's receipt/ledger/provenance layer",
    run(repo) {
      const files = git(repo, "ls-files").split("\n").filter(Boolean);
      const rx = /(^|\/)(receipts?|ledger|ledgers|provenance|audit|sessions?|evidence|records?)(\/|$)|receipt|ledger|provenance/i;
      const hits = files.filter((f) => rx.test(f) && /\.(json|jsonl|ndjson|md|txt)$/i.test(f));
      const groups = {};
      for (const h of hits) {
        const g = h.split("/").slice(0, 2).join("/");
        groups[g] = (groups[g] || 0) + 1;
      }
      return {
        receipt_like_files: hits.length,
        sample: hits.slice(0, 14),
        groups: Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 8)
          .map(([group, count]) => ({ group, count })),
      };
    },
  },
  {
    name: "ledger.chains",
    why: "hash-chain custody: tips the repo itself seals",
    run(repo) {
      const files = git(repo, "ls-files", "*.jsonl", "*.ndjson").split("\n").filter(Boolean).slice(0, 40);
      const chains = [];
      for (const f of files) {
        try {
          const st = statSync(join(repo, f));
          if (st.size > 8 * 1024 * 1024) continue;
          const lines = readFileSync(join(repo, f), "utf8").split(/\r?\n/).filter(Boolean);
          if (!lines.length) continue;
          let last = null;
          try { last = JSON.parse(lines[lines.length - 1]); } catch { continue; }
          const keys = Object.keys(last);
          const chainy = ["seq", "tip", "prev", "prev_hash", "id", "sig", "signature"].some((k) => keys.includes(k));
          if (!chainy) continue;
          const tip = String(last.tip || last.hash || last.id || "").slice(0, 16);
          chains.push({ file: f, rows: lines.length, seq: last.seq ?? null, tip });
        } catch { /* unreadable → skip, honestly */ }
      }
      return { chain_shaped_files: chains.length, chains: chains.slice(0, 10) };
    },
  },
  {
    name: "readme.summary",
    why: "the repo's self-description, in its own words",
    run(repo) {
      const cands = git(repo, "ls-files").split("\n").filter((f) => /(^|\/)readme(\.|$)/i.test(f));
      const pick = cands.find((c) => /^readme\.md$/i.test(c)) || cands[0];
      if (!pick) return { file: null, lines: [] };
      return { file: pick, lines: headLines(join(repo, pick), 14).slice(0, 10) };
    },
  },
  {
    name: "manifest.summary",
    why: "declared identity: name, version, entry points",
    run(repo) {
      const tryJSON = (p) => {
        try {
          const j = JSON.parse(readFileSync(join(repo, p), "utf8"));
          return { kind: "package.json", file: p, name: j.name, version: j.version, description: cap(String(j.description || ""), 120), scripts: Object.keys(j.scripts || {}).slice(0, 8) };
        } catch { return null; }
      };
      const pj = tryJSON("package.json") || tryJSON("worker/package.json");
      if (pj) return pj;
      const scan = (p, rx) => {
        try {
          const t = readFileSync(join(repo, p), "utf8");
          const m = t.match(rx);
          if (m) return { kind: p, file: p, name: m[1], version: (t.match(/version\s*=\s*"([^"]+)"/) || [])[1] || null };
        } catch { /* absent */ }
        return null;
      };
      return scan("pyproject.toml", /^\s*name\s*=\s*"([^"]+)"/m)
        || scan("Cargo.toml", /^\s*name\s*=\s*"([^"]+)"/m)
        || scan("go.mod", /^module\s+(\S+)/m)
        || { kind: "none" };
    },
  },
  {
    name: "laws.scan",
    why: "where the repo states its own rules (law/invariant/never/always/must)",
    run(repo) {
      const files = git(repo, "ls-files", "*.md").split("\n").filter(Boolean);
      const readmes = files.filter((f) => /(^|\/)readme/i.test(f));
      const rest = files.filter((f) => !readmes.includes(f)).sort((a, b) => a.split("/").length - b.split("/").length);
      const scanList = [...readmes, ...rest].slice(0, 24);
      const rx = /\b(law|laws|invariant|invariants|rule|rules|never|always|must not|must)\b/i;
      const hits = [];
      for (const f of scanList) {
        if (hits.length >= 15) break;
        let lines = [];
        try { lines = readFileSync(join(repo, f), "utf8").split(/\r?\n/); } catch { continue; }
        for (let i = 0; i < lines.length; i++) {
          if (hits.length >= 15) break;
          if (rx.test(lines[i]) && lines[i].trim().length > 12)
            hits.push({ ref: `${f}:${i + 1}`, text: cap(oneLine(lines[i]), 120) });
        }
      }
      return { scanned_files: scanList.length, law_statements: hits };
    },
  },
  {
    name: "git.state",
    why: "honesty probe: is the tree clean at interrogation time",
    run(repo) {
      const st = git(repo, "status", "--porcelain").split("\n").filter(Boolean);
      let branches = [], tags = [];
      try { branches = git(repo, "branch", "--format=%(refname:short)").split("\n").filter(Boolean); } catch { /* */ }
      try { tags = git(repo, "tag").split("\n").filter(Boolean); } catch { /* */ }
      return {
        dirty_entries: st.length,
        dirty_sample: st.slice(0, 6).map(oneLine),
        local_branches: branches.length,
        tags: tags.length,
      };
    },
  },
];

// --------------------------------------------------------------- question →
// focus selection. Deterministic keyword scoring — no model, just arithmetic.

const FOCUS_RULES = [
  { id: "laws", kw: ["law", "laws", "rule", "rules", "invariant", "enforce", "enforced", "discipline", "policy"] },
  { id: "receipts", kw: ["receipt", "receipts", "ledger", "chain", "custody", "audit", "evidence", "record"] },
  { id: "provenance", kw: ["provenance", "tip", "origin", "history", "ancestry", "genesis", "came", "lineage", "author", "authors", "who", "when", "version", "commit", "current"] },
  { id: "location", kw: ["where", "live", "lives", "located", "stored", "kept", "path", "file", "files"] },
  { id: "inventory", kw: ["how", "many", "count", "number", "size", "census", "inventory", "much"] },
  { id: "identity", kw: ["what", "about", "purpose", "summarize", "summary", "overview", "describe", "is"] },
];

function selectFocus(question) {
  const tokens = question.toLowerCase().match(/[a-z]+/g) || [];
  const scored = FOCUS_RULES.map((r) => {
    const matched = r.kw.filter((k) => tokens.includes(k));
    return { id: r.id, matched, score: matched.length };
  }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  const focus = scored.length ? scored.slice(0, 2).map((r) => r.id) : ["identity", "provenance"];
  return { tokens: uniqSorted(tokens), focus, matches: scored.slice(0, 2) };
}

const FOCUS_PROBES = {
  laws: ["laws.scan", "census.docs", "readme.summary"],
  receipts: ["ledger.receipts", "ledger.chains", "git.state"],
  provenance: ["git.identity", "git.log.recent", "git.log.genesis", "git.authors", "ledger.chains"],
  location: ["census.files", "census.docs", "git.heat", "ledger.receipts"],
  inventory: ["census.files", "git.log.recent", "ledger.receipts"],
  identity: ["readme.summary", "manifest.summary", "census.files"],
};

// --------------------------------------------------------------- composing --

function compose(question, findings, sel) {
  const byName = Object.fromEntries(findings.map((f) => [f.probe, f.finding]));
  const ev = (name) => byName[name];
  const promoted = sel.focus.flatMap((f) => FOCUS_PROBES[f] || []);
  const order = uniqSorted([...promoted, ...findings.map((f) => f.probe)]);

  const trail = order.map((name, i) => {
    const meta = PROBES.find((p) => p.name === name);
    const promotedNote = promoted.includes(name)
      ? `PROMOTED by focus [${sel.focus.filter((f) => (FOCUS_PROBES[f] || []).includes(name)).join(", ")}]`
      : "battery default";
    return `${i + 1}. ${name} — ${meta ? meta.why : "—"} (${promotedNote})`;
  });

  // every bullet is guarded: a probe that errored yields {error,detail} and is
  // skipped honestly here rather than crashing the composition.
  const bullets = [];
  const idf = ev("git.identity");
  if (idf && idf.head)
    bullets.push(`[git.identity] tip = ${idf.head.slice(0, 12)} on branch "${idf.branch}" — "${cap(idf.subject, 90)}" (${idf.date}); remote: ${idf.remote}.`);
  const rec = ev("git.log.recent");
  if (rec && Array.isArray(rec.recent))
    bullets.push(`[git.log.recent] ${rec.total_commits ?? "?"} commits; latest ${rec.recent.length ? rec.recent[0].sha + " " + cap(rec.recent[0].subject, 80) : "(none)"}.`);
  const gen = ev("git.log.genesis");
  if (gen && gen.first_commit && gen.first_commit.sha)
    bullets.push(`[git.log.genesis] lineage starts at ${gen.first_commit.sha} (${gen.first_commit.date}) "${cap(gen.first_commit.subject, 80)}".`);
  const au = ev("git.authors");
  if (au && Array.isArray(au.top))
    bullets.push(`[git.authors] ${au.distinct_authors ?? "?"} distinct authors; top: ${au.top.map((a) => `${a.name}(${a.commits})`).join(", ")}.`);
  const heat = ev("git.heat");
  if (heat && Array.isArray(heat.hottest) && heat.hottest.length)
    bullets.push(`[git.heat] most-committed files: ${heat.hottest.slice(0, 5).map((h) => `${h.path}(${h.touches})`).join(", ")}.`);
  const cf = ev("census.files");
  if (cf && Array.isArray(cf.by_extension))
    bullets.push(`[census.files] ${cf.tracked_files} tracked files; by ext: ${cf.by_extension.slice(0, 5).map((e) => `.${e.extension}×${e.count}`).join(", ")}; top dirs: ${cf.top_dirs.slice(0, 4).map((d) => `${d.dir}(${d.count})`).join(", ")}.`);
  const docs = ev("census.docs");
  if (docs && Array.isArray(docs.readmes))
    bullets.push(`[census.docs] ${docs.doc_files} doc files; README(s): ${docs.readmes.length ? docs.readmes.join(", ") : "none"}; sample: ${docs.docs_sample.slice(0, 6).join(", ")}.`);
  const lr = ev("ledger.receipts");
  if (lr && typeof lr.receipt_like_files === "number")
    bullets.push(`[ledger.receipts] ${lr.receipt_like_files} receipt/ledger-like files${lr.groups.length ? "; groups: " + lr.groups.map((g) => `${g.group}(${g.count})`).join(", ") : ""}.`);
  const lc = ev("ledger.chains");
  if (lc && typeof lc.chain_shaped_files === "number")
    bullets.push(`[ledger.chains] ${lc.chain_shaped_files} chain-shaped ledger(s)${lc.chains.length ? "; tips: " + lc.chains.slice(0, 4).map((c) => `${c.file} rows=${c.rows} tip=${c.tip || "?"}…`).join("; ") : ""}.`);
  const rd = ev("readme.summary");
  if (rd && rd.file)
    bullets.push(`[readme.summary] ${rd.file} opens: ${rd.lines.slice(0, 3).join(" | ") || "(empty)"}.`);
  const mf = ev("manifest.summary");
  if (mf && mf.kind && mf.kind !== "none")
    bullets.push(`[manifest.summary] ${mf.kind}: ${mf.name || "?"}${mf.version ? " v" + mf.version : ""}${mf.scripts && mf.scripts.length ? "; scripts: " + mf.scripts.join(",") : ""}.`);
  const laws = ev("laws.scan");
  if (laws && Array.isArray(laws.law_statements))
    bullets.push(`[laws.scan] ${laws.law_statements.length} law-like statement(s) in ${laws.scanned_files} md files scanned${laws.law_statements.length ? "; e.g. " + laws.law_statements.slice(0, 4).map((l) => l.ref + " “" + cap(l.text, 70) + "”").join("; ") : ""}.`);
  const st = ev("git.state");
  if (st && typeof st.dirty_entries === "number")
    bullets.push(`[git.state] tree ${st.dirty_entries === 0 ? "CLEAN" : "dirty (" + st.dirty_entries + " entries)"}; ${st.local_branches} local branch(es), ${st.tags} tag(s).`);

  const questionLower = question.toLowerCase();
  const answerParts = [];
  if (sel.focus.includes("provenance") || /provenance|tip|origin|history/.test(questionLower))
    answerParts.push(
      `Provenance of the current tip: ${idf && idf.head ? `${idf.head.slice(0, 12)} on "${idf.branch}" — "${cap(idf.subject, 80)}" at ${idf.date}, pushed to ${idf.remote}` : "HEAD unreadable"}.` +
      (gen && gen.first_commit && gen.first_commit.sha ? ` The lineage begins at ${gen.first_commit.sha} "${cap(gen.first_commit.subject, 60)}" (${gen.first_commit.date}); ${rec && typeof rec.total_commits === "number" ? rec.total_commits + " commits later, the record is continuous." : ""}` : "")
    );
  if (sel.focus.includes("laws") || /law|rule|invariant|enforce/.test(questionLower))
    answerParts.push(
      `Laws this repo states about itself: ${laws && Array.isArray(laws.law_statements) && laws.law_statements.length
        ? laws.law_statements.slice(0, 6).map((l) => l.ref + " — “" + cap(l.text, 90) + "”").join("; ")
        : "no explicit law/invariant statements found in scanned md files"}. They live exactly at the cited file:line refs.`
    );
  if (sel.focus.includes("receipts"))
    answerParts.push(
      `Receipt/custody layer: ${lr && typeof lr.receipt_like_files === "number" ? lr.receipt_like_files + " receipt-like files" : "none detected"}; ${lc && typeof lc.chain_shaped_files === "number" && lc.chain_shaped_files ? lc.chain_shaped_files + " hash-chained ledger(s) with tips " + lc.chains.slice(0, 3).map((c) => c.file + "→" + (c.tip || "?") + "…").join(", ") : "no chain-shaped ledger detected"}.`
    );
  if (sel.focus.includes("location"))
    answerParts.push(
      `Where things live: ${cf && Array.isArray(cf.top_dirs) ? cf.top_dirs.slice(0, 4).map((d) => d.dir + " (" + d.count + " files)").join(", ") : "census empty"}; prose in ${docs && Array.isArray(docs.readmes) ? (docs.readmes.length ? docs.readmes.join(", ") : "no README") : "?"}; history concentrates in ${heat && Array.isArray(heat.hottest) && heat.hottest.length ? heat.hottest.slice(0, 3).map((h) => h.path).join(", ") : "n/a"}.`
    );
  if (sel.focus.includes("inventory"))
    answerParts.push(
      `Inventory: ${cf && Array.isArray(cf.by_extension) ? cf.tracked_files + " tracked files (" + cf.by_extension.slice(0, 3).map((e) => "." + e.extension + "×" + e.count).join(", ") + ")" : "?"}; ${rec && typeof rec.total_commits === "number" ? rec.total_commits + " commits by " + (au && typeof au.distinct_authors === "number" ? au.distinct_authors + " author(s)" : "?") + "." : ""}`
    );
  if (!answerParts.length)
    answerParts.push(
      `What this repo is, from its own record: ${rd && rd.file ? rd.file + " — " + (rd.lines[0] || "") + " " + (rd.lines[1] || "") : "(no README)"}` +
      (mf && mf.kind && mf.kind !== "none" ? ` Manifest: ${mf.name || "?"}${mf.version ? " v" + mf.version : ""}.` : "") +
      (rec && typeof rec.total_commits === "number" ? ` ${rec.total_commits} commits; tip ${idf && idf.head ? idf.head.slice(0, 12) : "?"} "${idf ? cap(idf.subject, 60) : ""}".` : "")
    );

  return {
    evidence: findings,
    decomposition:
      `Question tokens: [${sel.tokens.join(", ") || "none"}] → focus selected: [${sel.focus.join(", ")}]` +
      (sel.matches.length ? ` (matched: ${sel.matches.map((m) => m.id + ":" + m.matched.join("|")).join("; ")})` : " (no keyword hit → default identity+provenance)") +
      `. The FIXED battery of ${PROBES.length} read-only probes ran in full — every probe, every ask, in declared order. ` +
      `The answer below is composed ONLY from these findings, in this trail order:\n` +
      trail.join("\n"),
    answer: answerParts.join("\n\n"),
  };
}

// -------------------------------------------------------------------- ask ----

function ask(repoPath, question, wantJson, saveDir) {
  const repo = resolve(repoPath);
  if (!existsSync(repo)) die(2, "E_PATH_MISSING", `no such path: ${repo}`);
  let isRepo = false;
  try { git(repo, "rev-parse", "--git-dir"); isRepo = true; } catch { /* below */ }
  if (!isRepo) die(2, "E_NOT_A_REPO", `${repo} is not a git repository (rev-parse failed)`);

  const findings = [];
  for (const probe of PROBES) {
    try {
      findings.push({ probe: probe.name, finding: probe.run(repo) });
    } catch (e) {
      findings.push({ probe: probe.name, finding: { error: "probe_failed", detail: cap(String(e.message || e), 160) } });
    }
  }
  const sel = selectFocus(question);
  const composed = compose(question, findings, sel);

  // graceful empty-repo honesty (no commits yet): git.identity errors → surface it
  const identity = findings.find((f) => f.probe === "git.identity");
  if (identity.finding.error)
    composed.answer = `This repository has no commits yet (git.identity probe: ${identity.finding.detail}). All other probes ran against an empty history.`;

  const out = {
    question,
    repo,
    head: (identity.finding && identity.finding.head) || null,
    focus: sel.focus,
    evidence: composed.evidence,
    decomposition: composed.decomposition,
    answer: composed.answer,
  };

  const md =
    `# oracle session — ${basename(repo)} ${out.head ? out.head.slice(0, 7) : "(no HEAD)"}\n\n` +
    `- **repo**: ${repo}\n- **question**: ${question}\n- **focus**: ${out.focus.join(", ")}\n` +
    `- **tool**: tools/repo-oracle.mjs (deterministic battery, read-only, no model)\n\n` +
    `## decomposition (the trail)\n\n${composed.decomposition}\n\n` +
    `## answer\n\n${composed.answer}\n\n` +
    `## evidence (raw probe findings)\n\n` +
    composed.evidence.map((f) => `### ${f.probe}\n\n\`\`\`json\n${JSON.stringify(f.finding, null, 2)}\n\`\`\`\n`).join("\n");

  if (saveDir) {
    const name = `${basename(repo)}.${out.head ? out.head.slice(0, 7) : "nohead"}.${slug(question)}`;
    mkdirSync(saveDir, { recursive: true });
    writeFileSync(join(saveDir, name + ".json"), JSON.stringify(out, null, 2) + "\n");
    writeFileSync(join(saveDir, name + ".md"), md + "\n");
    process.stdout.write(`saved: ${join(saveDir, name + ".json")}\nsaved: ${join(saveDir, name + ".md")}\n`);
  }

  if (wantJson) process.stdout.write(JSON.stringify(out, null, 2) + "\n");
  else process.stdout.write(md + "\n");
}

// -------------------------------------------------------------- self-test ---

function selfTest(wantJson) {
  const results = [];
  const check = (id, ok, detail) => { results.push({ id, ok, detail }); if (!ok) process.exitCode = 1; };
  const here = dirname(fileURLToPath(import.meta.url)); // this script's dir
  const script = join(here, "repo-oracle.mjs");
  const tmp = mkdtempSync(join(tmpdir(), "repo-oracle-test-"));

  try {
    // fixture: a tiny repo with two commits
    const fx = join(tmp, "fixture");
    mkdirSync(join(fx, "tools"), { recursive: true });
    git(fx, "init", "-b", "main");
    git(fx, "config", "user.email", "oracle@test");
    git(fx, "config", "user.name", "oracle-test");
    writeFileSync(join(fx, "README.md"), "# Fixture\n\nLaw: every answer must cite its evidence.\n");
    writeFileSync(join(fx, "tools", "a.mjs"), "export const a = 1;\n");
    git(fx, "add", "-A"); git(fx, "commit", "-m", "genesis: fixture born");
    writeFileSync(join(fx, "tools", "b.mjs"), "export const b = 2;\n");
    git(fx, "add", "-A"); git(fx, "commit", "-m", "add b.mjs");

    const runAsk = (a) => JSON.parse(execFileSync(process.execPath, [script, ...a], { maxBuffer: 8 * 1024 * 1024 }).toString());
    const r1 = runAsk(["ask", fx, "what is the provenance of the current tip?", "--json"]);
    check("ask.json.shape", !!(r1.question && Array.isArray(r1.evidence) && r1.decomposition && r1.answer),
      "question/evidence/decomposition/answer all present");
    check("ask.probes.ran", r1.evidence.length === PROBES.length, `battery count ${r1.evidence.length} == ${PROBES.length}`);
    check("ask.probe.identity", r1.evidence.some((e) => e.probe === "git.identity" && e.finding.head) && !!r1.head,
      "git.identity produced the HEAD anchor");
    check("ask.probe.genesis", r1.evidence.some((e) => e.probe === "git.log.genesis" && e.finding.first_commit && e.finding.first_commit.sha),
      "git.log.genesis found the first commit");
    check("ask.focus.provenance", r1.focus.includes("provenance"), "question tokens routed to provenance focus");
    check("ask.trail.cites", /git\.identity/.test(r1.decomposition) && /battery/i.test(r1.decomposition),
      "decomposition names the consulted probes");
    check("ask.answer.cites", /genesis|tip/i.test(r1.answer), "answer cites concrete commit evidence");

    const r2 = runAsk(["ask", fx, "what laws does this repo enforce and where do they live?", "--json"]);
    check("ask.focus.laws", r2.focus.includes("laws"), "laws question routed to laws focus");
    check("ask.laws.found", r2.evidence.some((e) => e.probe === "laws.scan" && (e.finding.law_statements || []).length >= 1),
      "laws.scan found the fixture's Law line in README");

    // non-repo refusal (an existing dir that is not a git repo)
    let refused = false;
    const notRepo = join(tmp, "not-a-repo");
    mkdirSync(notRepo);
    try { execFileSync(process.execPath, [script, "ask", notRepo, "hello?", "--json"]); }
    catch (e) { refused = e.status === 2 && /E_NOT_A_REPO/.test(String(e.stderr || "")); }
    check("refuse.not_a_repo", refused, "E_NOT_A_REPO, exit 2, named error");

    // empty repo (init, no commit) → honest degradation, exit 0
    const empty = join(tmp, "empty");
    mkdirSync(empty); git(empty, "init", "-b", "main");
    const r3 = runAsk(["ask", empty, "what is this?", "--json"]);
    check("empty.honest", r3.head === null && /no commits yet/i.test(r3.answer), "empty repo answered honestly, no crash");

    // read-only law: fixture HEAD unchanged after everything above
    const headAfter = git(fx, "rev-parse", "HEAD").trim();
    check("readonly.head_unchanged", !!headAfter, `HEAD ${headAfter.slice(0, 7)} untouched — oracle never writes`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  const passed = results.filter((r) => r.ok).length;
  const body = { self_test: "repo-oracle.mjs", passed, failed: results.length - passed, results };
  if (wantJson) process.stdout.write(JSON.stringify(body, null, 2) + "\n");
  else {
    for (const r of results) process.stdout.write(`${r.ok ? "PASS" : "FAIL"} ${r.id} — ${r.detail}\n`);
    process.stdout.write(`\n${passed}/${results.length} pins green${process.exitCode ? " (FAILURES ABOVE)" : ""}\n`);
  }
}

// ------------------------------------------------------------------- main ---

const argv = process.argv.slice(2);
const wantJson = argv.includes("--json");
const saveIdx = argv.indexOf("--save");
const saveDir = saveIdx >= 0 ? argv[saveIdx + 1] : null;
const args = argv.filter((a, i) => a !== "--json" && a !== "--save" && !(saveIdx >= 0 && i === saveIdx + 1));

if (args[0] === "ask" && args.length >= 3) ask(args[1], args.slice(2).join(" "), wantJson, saveDir);
else if (args[0] === "self-test") selfTest(wantJson);
else {
  process.stdout.write(
    `repo-oracle.mjs — deterministic repo-oracle: the repo's own records are the oracle.\n\n` +
    `usage:\n  node tools/repo-oracle.mjs ask <repo-path> "<question>" [--json] [--save <dir>]\n` +
    `  node tools/repo-oracle.mjs self-test [--json]\n\n` +
    `battery: ${PROBES.map((p) => p.name).join(", ")}\n` +
    `laws: read-only (rev-parse|log|ls-files|branch|tag|status only), no network, no keys, no model.\n`
  );
  process.exit(args.length ? 1 : 0);
}
