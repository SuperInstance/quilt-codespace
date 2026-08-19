#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# .devcontainer/post-create.sh — Quilt Codespace setup
#
# Adapted from agent-workspace-template's post-create.sh pattern.
# Turns a GitHub Codespace into a live Quilt runtime with:
#   - Browser TUI on port 7681 (ttyd wrapping `quilt serve`)
#   - HTTP API on port 4096 (MCP-compatible cell access)
#   - Dashboard on port 8080 (federation page)
#
# Token-authenticated for external callers (IoT devices, agents,
# sibling Codespaces). The token is generated at first boot and
# printed to the log; it persists in ~/.quilt-env.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${CYAN}[quilt-codespace]${NC} $*"; }
ok()  { echo -e "${GREEN}[quilt-codespace]${NC} ✓ $*"; }
warn() { echo -e "${YELLOW}[quilt-codespace]${NC} ⚠ $*"; }

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Quilt Codespace — post-create setup"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── 1. Install Quilt from npm ────────────────────────────────────
log "Installing Quilt packages..."
npm install -g @quilt/core @quilt/sdk @quilt/cli 2>&1 | tail -3 || warn "Global install skipped (may need sudo)"

# ── 2. Generate runtime token (if not provided) ──────────────────
if [ -z "${QUILT_TOKEN:-}" ]; then
  if [ -f ~/.quilt-env ]; then
    source ~/.quilt-env
  fi
  if [ -z "${QUILT_TOKEN:-}" ]; then
    QUILT_TOKEN=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p -c 32)
    echo "export QUILT_TOKEN=$QUILT_TOKEN" >> ~/.quilt-env
    ok "Generated runtime token"
  fi
fi
export QUILT_TOKEN

# ── 3. Persistent state directories ─────────────────────────────
mkdir -p ~/.quilt/state
mkdir -p ~/.quilt/traces
mkdir -p ~/.quilt/logs
mkdir -p ~/.quilt/pids

# ── 4. Install ttyd (browser terminal) ───────────────────────────
if ! command -v ttyd &>/dev/null; then
  log "Installing ttyd (browser terminal)..."
  TTYD_VERSION="1.7.7"
  ARCH=$(uname -m)
  case "$ARCH" in
    x86_64) TTYD_ARCH="x86_64" ;;
    aarch64) TTYD_ARCH="aarch64" ;;
    *) TTYD_ARCH="$ARCH" ;;
  esac
  curl -fsSL "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${TTYD_ARCH}-unknown-linux-gnu" \
    -o /usr/local/bin/ttyd 2>/dev/null || \
  curl -fsSL "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd" \
    -o /usr/local/bin/ttyd
  chmod +x /usr/local/bin/ttyd 2>/dev/null && ok "ttyd installed" || warn "ttyd install failed (TUI will be CLI-only)"
fi

# ── 5. Start Quilt runtime services ──────────────────────────────
log "Starting Quilt runtime services..."

# 5a. Browser TUI on port 7681
if command -v ttyd &>/dev/null; then
  nohup ttyd -p 7681 -W -t 'theme=quilt-dark' bash -c "export QUILT_TOKEN='$QUILT_TOKEN' && quilt serve ~/.quilt-state/default.yaml" \
    > ~/.quilt/logs/ttyd.log 2>&1 &
  echo $! > ~/.quilt/pids/ttyd.pid
  ok "TUI on port 7681 (PID $(cat ~/.quilt/pids/ttyd.pid))"
else
  warn "TUI not started (ttyd missing)"
fi

# 5b. HTTP API on port 4096 (uses the Quilt HTTP server from @quilt/sdk)
if [ -f scripts/quilt-http-server.js ]; then
  nohup node scripts/quilt-http-server.js --port 4096 --token "$QUILT_TOKEN" \
    > ~/.quilt/logs/http.log 2>&1 &
  echo $! > ~/.quilt/pids/http.pid
  ok "HTTP API on port 4096 (PID $(cat ~/.quilt/pids/http.pid))"
else
  warn "HTTP API script not found; skipping"
fi

# 5c. Dashboard on port 8080
if command -v npx &>/dev/null; then
  nohup npx --yes http-server -p 8080 -c-1 --cors examples/ \
    > ~/.quilt/logs/dashboard.log 2>&1 &
  echo $! > ~/.quilt/pids/dashboard.pid
  ok "Dashboard on port 8080 (PID $(cat ~/.quilt/pids/dashboard.pid))"
fi

# ── 6. Wait a moment for services to start ──────────────────────
sleep 2

# ── 7. Print connection info ─────────────────────────────────────
CODESPACE_NAME="${CODESPACE_NAME:-this-codespace}"
DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-githubpreview.dev}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}✓ Quilt Codespace is live${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Browser TUI:   https://${CODESPACE_NAME}-7681.${DOMAIN}"
echo "  HTTP API:      https://${CODESPACE_NAME}-4096.${DOMAIN}"
echo "  Dashboard:     https://${CODESPACE_NAME}-8080.${DOMAIN}"
echo ""
echo "  Token:         $QUILT_TOKEN"
echo ""
echo "  From anywhere (curl example):"
echo "    curl -H 'Authorization: Bearer $QUILT_TOKEN' \\"
echo "         https://${CODESPACE_NAME}-4096.${DOMAIN}/cells/local/default/cells.value"
echo ""
echo "  Subscribe to a cell (SSE):"
echo "    curl -N -H 'Authorization: Bearer $QUILT_TOKEN' \\"
echo "         https://${CODESPACE_NAME}-4096.${DOMAIN}/cells/local/default/cells.value/events"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Useful commands:"
echo "  quilt serve            # start a Quilt TUI in the current shell"
echo "  quilt run <sheet>      # evaluate a sheet, print cell values"
echo "  quilt validate <file>  # validate a manifest"
echo "  cat ~/.quilt-env       # see the runtime token"
echo ""
