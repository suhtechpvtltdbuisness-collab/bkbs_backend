#!/bin/sh
set -e

export PADDLE_OCR_HOST="${PADDLE_OCR_HOST:-127.0.0.1}"
export PADDLE_OCR_PORT="${PADDLE_OCR_PORT:-8090}"
export PADDLE_OCR_URL="${PADDLE_OCR_URL:-http://127.0.0.1:8090}"
export PADDLE_OCR_ENGINE="${PADDLE_OCR_ENGINE:-rapidocr}"
export PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK="${PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK:-True}"

echo "Starting Paddle OCR service on ${PADDLE_OCR_HOST}:${PADDLE_OCR_PORT}..."
.venv-ocr/bin/python scripts/ocr/paddle_ocr_service.py &
OCR_PID=$!

TRIES=0
MAX_TRIES=30
while [ "$TRIES" -lt "$MAX_TRIES" ]; do
  if wget -q -O - "http://${PADDLE_OCR_HOST}:${PADDLE_OCR_PORT}/health" >/dev/null 2>&1; then
    echo "Paddle OCR service is ready."
    break
  fi
  TRIES=$((TRIES + 1))
  sleep 2
done

if [ "$TRIES" -eq "$MAX_TRIES" ]; then
  echo "Paddle OCR service failed to start."
  kill "$OCR_PID" 2>/dev/null || true
  exit 1
fi

echo "Starting Node API on port ${PORT:-5000}..."
exec node src/server.js
