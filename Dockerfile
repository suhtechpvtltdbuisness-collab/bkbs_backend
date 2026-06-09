FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --only=production

COPY requirements-ocr-railway.txt ./
COPY scripts ./scripts
COPY src ./src
COPY index.js ./

RUN python3 -m venv .venv-ocr \
  && .venv-ocr/bin/pip install --no-cache-dir -r requirements-ocr-railway.txt

ENV NODE_ENV=production
ENV MONGODB_MAX_POOL_SIZE=10
ENV MONGODB_BUFFER_TIMEOUT_MS=30000
ENV PADDLE_OCR_ENGINE=rapidocr
ENV PADDLE_OCR_URL=http://127.0.0.1:8090
ENV PADDLE_OCR_HOST=127.0.0.1
ENV PADDLE_OCR_PORT=8090
ENV PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True
ENV OCR_USE_ANGLE_CLS=false
ENV OCR_MAX_SIDE=1280
ENV OCR_DET_LIMIT_SIDE_LEN=1280
ENV OCR_OMP_THREADS=2
ENV OCR_GUNICORN_WORKERS=1
ENV OCR_GUNICORN_THREADS=2

RUN chmod +x scripts/start-railway.sh

EXPOSE 5000

CMD ["scripts/start-railway.sh"]
# CMD ["node", "scripts/migrate_to_disk.js"]