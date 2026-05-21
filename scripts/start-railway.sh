#!/bin/sh
set -e

export PADDLE_OCR_HOST="${PADDLE_OCR_HOST:-127.0.0.1}"
export PADDLE_OCR_PORT="${PADDLE_OCR_PORT:-8090}"
export PADDLE_OCR_URL="${PADDLE_OCR_URL:-http://127.0.0.1:8090}"
export PADDLE_OCR_ENGINE="${PADDLE_OCR_ENGINE:-rapidocr}"
export PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK="${PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK:-True}"
export OCR_OMP_THREADS="${OCR_OMP_THREADS:-2}"
export OCR_GUNICORN_WORKERS="${OCR_GUNICORN_WORKERS:-1}"
export OCR_GUNICORN_THREADS="${OCR_GUNICORN_THREADS:-2}"

echo "Starting OCR service on ${PADDLE_OCR_HOST}:${PADDLE_OCR_PORT} (engine=${PADDLE_OCR_ENGINE})..."
.venv-ocr/bin/gunicorn -c scripts/ocr/gunicorn.conf.py --chdir scripts/ocr paddle_ocr_service:app &
OCR_PID=$!

TRIES=0
MAX_TRIES=30
while [ "$TRIES" -lt "$MAX_TRIES" ]; do
  if wget -q -O - "http://${PADDLE_OCR_HOST}:${PADDLE_OCR_PORT}/health" >/dev/null 2>&1; then
    echo "OCR service is ready."
    break
  fi
  TRIES=$((TRIES + 1))
  sleep 2
done

if [ "$TRIES" -eq "$MAX_TRIES" ]; then
  echo "OCR service failed to start."
  kill "$OCR_PID" 2>/dev/null || true
  exit 1
fi

echo "Starting Node API on port ${PORT:-5000}..."
exec node src/server.js
