import os

bind = f"{os.environ.get('PADDLE_OCR_HOST', '127.0.0.1')}:{os.environ.get('PADDLE_OCR_PORT', '8090')}"
workers = int(os.environ.get("OCR_GUNICORN_WORKERS", "1"))
threads = int(os.environ.get("OCR_GUNICORN_THREADS", "2"))
timeout = int(os.environ.get("OCR_GUNICORN_TIMEOUT", "120"))
graceful_timeout = 30
keepalive = 5
preload_app = True
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("OCR_LOG_LEVEL", "warning")
