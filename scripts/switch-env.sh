#!/usr/bin/env bash
# Switch .env.local between local development and production Supabase
# Usage: ./scripts/switch-env.sh [dev|prod]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

ENV_LOCAL="$PROJECT_DIR/.env.local"
ENV_DEV="$PROJECT_DIR/.env.development"
ENV_PROD="$PROJECT_DIR/.env.production"

case "${1:-}" in
  dev|local)
    cp "$ENV_DEV" "$ENV_LOCAL"
    echo "Switched to LOCAL development (127.0.0.1:54321)"
    echo "Make sure 'supabase start' is running (npx supabase start)"
    ;;
  prod|production)
    cp "$ENV_PROD" "$ENV_LOCAL"
    echo "Switched to PRODUCTION (cfesfpekzcjjjwgeaaks.supabase.co)"
    echo "⚠ You are now connected to the live database!"
    ;;
  status)
    if grep -q "127.0.0.1" "$ENV_LOCAL" 2>/dev/null; then
      echo "Currently: LOCAL development"
    elif grep -q "supabase.co" "$ENV_LOCAL" 2>/dev/null; then
      echo "Currently: PRODUCTION"
    else
      echo "Unknown — check .env.local manually"
    fi
    ;;
  *)
    echo "Usage: $0 [dev|prod|status]"
    echo "  dev    — use local Supabase (Docker)"
    echo "  prod   — use production Supabase (cloud)"
    echo "  status — show which environment is active"
    exit 1
    ;;
esac
