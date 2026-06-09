#!/usr/bin/env python3
import json
import os
import sys
import tempfile
import threading
from pathlib import Path

os.environ.setdefault("FLAGS_use_mkldnn", "0")
os.environ.setdefault("OMP_NUM_THREADS", os.environ.get("OCR_OMP_THREADS", "2"))
os.environ.setdefault("MKL_NUM_THREADS", os.environ.get("OCR_OMP_THREADS", "2"))
os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")

from flask import Flask, jsonify, request

from image_preprocess import preprocess_image_bytes

PORT = int(os.environ.get("PADDLE_OCR_PORT", "8090"))
HOST = os.environ.get("PADDLE_OCR_HOST", "127.0.0.1")
ENGINE_MODE = os.environ.get("PADDLE_OCR_ENGINE", "rapidocr").lower()
DET_LIMIT_SIDE_LEN = int(os.environ.get("OCR_DET_LIMIT_SIDE_LEN", "1280"))
USE_ANGLE_CLS = os.environ.get("OCR_USE_ANGLE_CLS", "false").lower() in (
    "1",
    "true",
    "yes",
)

app = Flask(__name__)
paddle_engine = None
rapid_engine = None
active_engine = None
_ocr_lock = threading.Lock()


def init_paddle_engine():
    global paddle_engine
    from paddleocr import PaddleOCR

    paddle_engine = PaddleOCR(use_textline_orientation=True, lang="en")
    return "paddleocr"


def init_rapid_engine():
    global rapid_engine
    from rapidocr_onnxruntime import RapidOCR

    rapid_engine = RapidOCR(
        use_angle_cls=USE_ANGLE_CLS,
        text_score=0.45,
        det_model_path="",
        det_limit_side_len=DET_LIMIT_SIDE_LEN,
        det_limit_type="max",
        det_box_thresh=0.45,
    )
    return "rapidocr-onnx"


def bootstrap_engine():
    global active_engine

    if ENGINE_MODE in ("rapidocr", "onnx"):
        active_engine = init_rapid_engine()
        return

    if ENGINE_MODE == "paddle":
        active_engine = init_paddle_engine()
        return

    try:
        active_engine = init_paddle_engine()
        print(f"PaddleOCR engine ready ({active_engine})", file=sys.stderr)
    except Exception as exc:
        print(f"PaddleOCR init failed, using ONNX fallback: {exc}", file=sys.stderr)
        active_engine = init_rapid_engine()
        print(f"PaddleOCR ONNX fallback ready ({active_engine})", file=sys.stderr)


def parse_paddle_result(result):
    lines = []

    for page in result or []:
        if isinstance(page, dict):
            texts = page.get("rec_texts") or []
            scores = page.get("rec_scores") or []
            boxes = page.get("rec_boxes") or page.get("dt_polys") or []

            for idx, text in enumerate(texts):
                confidence = float(scores[idx]) if idx < len(scores) else None
                box = (
                    boxes[idx].tolist()
                    if idx < len(boxes) and hasattr(boxes[idx], "tolist")
                    else boxes[idx]
                    if idx < len(boxes)
                    else None
                )
                lines.append({"text": str(text), "confidence": confidence, "box": box})
            continue

        if hasattr(page, "json"):
            payload = page.json
            if isinstance(payload, dict):
                texts = (
                    payload.get("res", {}).get("rec_texts")
                    or payload.get("rec_texts")
                    or []
                )
                scores = (
                    payload.get("res", {}).get("rec_scores")
                    or payload.get("rec_scores")
                    or []
                )
                for idx, text in enumerate(texts):
                    confidence = float(scores[idx]) if idx < len(scores) else None
                    lines.append(
                        {"text": str(text), "confidence": confidence, "box": None}
                    )

    lines.sort(key=lambda item: (item.get("box") or [[0, 0]])[0][1])
    text = "\n".join(line["text"] for line in lines if line.get("text"))
    return {"text": text, "lines": lines, "engine": "paddleocr"}


def run_paddle_ocr(image_path):
    result = paddle_engine.predict(str(image_path))
    return parse_paddle_result(result)


def run_rapid_ocr(image_path):
    result, _ = rapid_engine(str(image_path))
    lines = []

    for item in result or []:
        box, text, confidence = item[0], item[1], float(item[2])
        lines.append({"text": text, "confidence": confidence, "box": box})

    lines.sort(key=lambda item: item["box"][0][1])
    text = "\n".join(line["text"] for line in lines)
    return {"text": text, "lines": lines, "engine": "rapidocr-onnx"}


def run_ocr(image_path):
    if active_engine == "paddleocr":
        try:
            return run_paddle_ocr(image_path)
        except Exception as exc:
            print(f"PaddleOCR predict failed, retrying with ONNX: {exc}", file=sys.stderr)
            if rapid_engine is None:
                init_rapid_engine()
            return run_rapid_ocr(image_path)

    return run_rapid_ocr(image_path)


def run_ocr_locked(image_path):
    with _ocr_lock:
        return run_ocr(image_path)


@app.get("/health")
def health():
    return jsonify(
        {
            "success": True,
            "engine": active_engine,
            "message": "OCR service is running",
        }
    )


@app.post("/ocr")
def ocr():
    if "image" not in request.files:
        return jsonify({"success": False, "message": "image file is required"}), 400

    upload = request.files["image"]
    if not upload.filename:
        return jsonify({"success": False, "message": "image file is required"}), 400

    temp_path = None

    try:
        raw_bytes = upload.read()
        if not raw_bytes:
            return jsonify({"success": False, "message": "image file is empty"}), 400

        processed_bytes = preprocess_image_bytes(raw_bytes)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            temp_file.write(processed_bytes)
            temp_path = temp_file.name

        data = run_ocr_locked(temp_path)
        return jsonify({"success": True, "data": data})
    except Exception as exc:
        return jsonify({"success": False, "message": str(exc)}), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


bootstrap_engine()

if __name__ == "__main__":
    app.run(host=HOST, port=PORT, debug=False, use_reloader=False, threaded=True)
