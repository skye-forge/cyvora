#!/usr/bin/env bash
set -euo pipefail

HOST="${POSTGRES_HOST:-localhost}"
PORT="${POSTGRES_PORT:-5432}"
TIMEOUT="${DB_WAIT_TIMEOUT:-60}"

echo "Waiting for Postgres at ${HOST}:${PORT} (timeout ${TIMEOUT}s)..."

elapsed=0
until nc -z "$HOST" "$PORT" 2>/dev/null; do
  sleep 1
  elapsed=$((elapsed + 1))
  if [ "$elapsed" -ge "$TIMEOUT" ]; then
    echo "Timed out waiting for Postgres after ${TIMEOUT}s." >&2
    exit 1
  fi
done

echo "Postgres is up."