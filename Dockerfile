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
ENV PADDLE_OCR_ENGINE=rapidocr
ENV PADDLE_OCR_URL=http://127.0.0.1:8090
ENV PADDLE_OCR_HOST=127.0.0.1
ENV PADDLE_OCR_PORT=8090
ENV PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True

RUN chmod +x scripts/start-railway.sh

EXPOSE 5000

CMD ["scripts/start-railway.sh"]
