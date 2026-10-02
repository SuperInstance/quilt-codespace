#!/usr/bin/env bash
# fixture-patch.sh — bundled REAL fixture for fix-loop --simulate mode.
# Fixes actual doc drift in README.md (the ports table) if not already fixed.
# Honest: this is a real edit a coder-agent could be asked to make; the loop
# treats it exactly like a model-authored patch.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if grep -q "port 4097" README.md 2>/dev/null; then
  echo "[fixture] already applied"
  exit 0
fi
cat >> README.md <<'EOF'

## Oracle API (added by wave-66)

- `oracle/oracle.py serve --port 4097` — deterministic repo-oracle JSON API:
  `/health` (receipt-chain verify), `/ask?q=`, `/symbol/<name>`, `/heat`.
EOF
echo "[fixture] README.md oracle section appended"
