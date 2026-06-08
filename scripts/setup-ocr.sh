#!/bin/sh
set -e

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
VENV_DIR="$ROOT_DIR/.venv-ocr"

python3 -m venv "$VENV_DIR"
"$VENV_DIR/bin/python" -m pip install --upgrade pip

if "$VENV_DIR/bin/pip" install -r "$ROOT_DIR/requirements-ocr.txt"; then
  echo "OCR environment ready (paddle + rapidocr)."
else
  echo "Full OCR stack unavailable on this Python build; installing RapidOCR fallback..."
  "$VENV_DIR/bin/pip" install -r "$ROOT_DIR/requirements-ocr-railway.txt"
  echo "OCR environment ready (rapidocr only)."
fi
