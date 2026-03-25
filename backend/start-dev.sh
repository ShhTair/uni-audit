#!/bin/bash
# UniAudit Backend Dev Mode (hot reload)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ENV_FILE="../.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

source venv/bin/activate 2>/dev/null || python3.12 -m venv venv && source venv/bin/activate

pip install -r requirements.txt -q

exec python3.12 -m uvicorn src.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --reload \
  --log-level debug
