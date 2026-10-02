#!/usr/bin/env bash
# self-test.sh — FAIL-first pins for the oracle PoC.
# Pin philosophy (fleet law): the pin must be able to fail. Tamper and
# missing-map cases below are NEGATIVE pins: they must fail closed, by name.
# Usage: bash oracle/self-test.sh [--quick]
set -u
cd "$(dirname "$0")/.."
O="python3 oracle/oracle.py"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "ok   - $1"; }
bad()  { FAIL=$((FAIL+1)); echo "FAIL - $1"; }
need() { # $1 desc, $2 test (bash), $3 expected-substring of output
  local out
  out=$(eval "$2" 2>&1)
  if [[ "$out" == *"$3"* ]]; then ok "$1"; else bad "$1 (wanted '$3' got: $(echo "$out" | tail -1 | head -c 120))"; fi
}

# P0 (fail-first proof): before build, ask must refuse honestly.
if [ ! -f .quilt/repo-map/tree.json ]; then
  need "P0 pre-build ask refuses (NO_MATCH honest)" \
    "$O ask where is chain_append" "NO_MATCH"
else
  echo "skip - P0 (map already built; fail-first evidence lives in the first boot log)"
fi

# P1 build produces the map with receipts.
need "P1 build writes repo-map + receipt" "$O build" '"files"'

# P2 queries answer from the map.
need "P2 where finds chain_append" "$O where chain_append" "oracle/oracle.py"
need "P3 what describes oracle.py" "$O what oracle/oracle.py" '"symbols"'
need "P4 hot lists heat" "$O hot 5" '"hot"'
need "P5 plan drafts cells" "$O plan fix the ports doc drift in the http server" '"RECEIPT"'

# P6 chain verifies.
need "P6 receipt chain verifies" "$O verify" '"ok": true'

# P7 tamper is caught, by name (negative pin on a COPY, never the ledger).
cp .quilt/oracle-receipts.jsonl /tmp/oracle-tamper.jsonl
python3 - <<'PY'
import json
rows = [json.loads(l) for l in open('/tmp/oracle-tamper.jsonl')]
rows[0]['payload']['files'] = 999999
with open('/tmp/oracle-tamper.jsonl','w') as f:
    for r in rows: f.write(json.dumps(r, sort_keys=True, separators=(',',':'))+"\n")
PY
need "P7 tampered chain refuses (RECEIPT_HASH_MISMATCH)" \
  "python3 oracle/oracle.py verify 2>/dev/null || true; python3 - <<'EOF'
import sys, json
sys.path.insert(0, 'oracle')
import oracle
print(json.dumps(oracle.chain_verify('/tmp/oracle-tamper.jsonl')))
EOF" "RECEIPT_HASH_MISMATCH"

# P8 custody gap caught (negative pin).
python3 - <<'PY'
import json
rows = [json.loads(l) for l in open('.quilt/oracle-receipts.jsonl')]
gap = dict(rows[0]); gap['seq'] = 2
rows.insert(1, gap)
with open('/tmp/oracle-gap.jsonl','w') as f:
    for r in rows: f.write(json.dumps(r, sort_keys=True, separators=(',',':'))+"\n")
PY
need "P8 custody gap refuses (CUSTODY_GAP)" \
  "python3 - <<'EOF'
import sys, json
sys.path.insert(0, 'oracle')
import oracle
print(json.dumps(oracle.chain_verify('/tmp/oracle-gap.jsonl')))
EOF" "CUSTODY_GAP"

# P9 serve mode boots and answers /health (unless --quick).
if [ "${1:-}" != "--quick" ]; then
  $O serve --port 4097 >/dev/null 2>&1 &
  SPID=$!
  sleep 1
  H=$(curl -s localhost:4097/health 2>/dev/null || echo "")
  kill $SPID 2>/dev/null
  if [[ "$H" == *'"status": "ready"'* ]]; then ok "P9 HTTP /health serves ready"; else bad "P9 HTTP /health"; fi
else
  echo "skip - P9 (quick mode)"
fi

echo ""
echo "self-test: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
