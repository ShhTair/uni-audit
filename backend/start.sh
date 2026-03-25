#!/bin/bash
# UniAudit Backend Startup Script
# Run this on your VM to start the backend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env from project root
ENV_FILE="../.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
  echo "✓ Loaded .env"
else
  echo "⚠ .env not found at $ENV_FILE — using existing environment"
fi

# Create venv if missing
if [ ! -d "venv" ]; then
  echo "Creating Python 3.12 virtual environment..."
  python3.12 -m venv venv
fi

source venv/bin/activate

# Install/update deps
pip install -r requirements.txt -q

# Install Playwright browsers if missing
python -m playwright install chromium --quiet 2>/dev/null || true

# Validate required env vars
: "${MONGODB_URI:?MONGODB_URI is required}"
: "${AZURE_OPENAI_ENDPOINT:?AZURE_OPENAI_ENDPOINT is required}"
: "${AZURE_OPENAI_API_KEY:?AZURE_OPENAI_API_KEY is required}"

PORT="${PORT:-8000}"
HOST="${HOST:-0.0.0.0}"

echo "✓ Starting UniAudit Backend on $HOST:$PORT"
exec python3.12 -m uvicorn src.main:app \
  --host "$HOST" \
  --port "$PORT" \
  --workers 2 \
  --access-log \
  --log-level info
