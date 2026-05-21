import { ApiError } from "../utils/apiResponse.js";
import { withOcrSlot } from "../utils/ocrConcurrency.js";

const DEFAULT_OCR_URL = "http://127.0.0.1:8090";
const OCR_TIMEOUT_MS = Number.parseInt(
  process.env.PADDLE_OCR_TIMEOUT_MS || "60000",
  10,
);

const getOcrBaseUrl = () =>
  (process.env.PADDLE_OCR_URL || DEFAULT_OCR_URL).replace(/\/$/, "");

class PaddleOcrClient {
  async recognize(buffer, mimetype = "image/jpeg", originalName = "aadhaar.jpg") {
    return withOcrSlot(() =>
      this._recognizeInternal(buffer, mimetype, originalName),
    );
  }

  async _recognizeInternal(
    buffer,
    mimetype = "image/jpeg",
    originalName = "aadhaar.jpg",
  ) {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimetype });
    formData.append("image", blob, originalName);

    let response;

    try {
      response = await fetch(`${getOcrBaseUrl()}/ocr`, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(OCR_TIMEOUT_MS),
      });
    } catch (error) {
      if (error?.name === "TimeoutError") {
        throw new ApiError(
          504,
          "OCR request timed out. Try a clearer, smaller image.",
        );
      }

      throw new ApiError(
        503,
        "OCR service is unavailable. Start it with: npm run ocr:service",
      );
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.success) {
      throw new ApiError(
        response.status || 500,
        payload?.message || "OCR request failed",
      );
    }

    return payload.data;
  }

  linesToText(lines = []) {
    if (!lines.length) {
      return "";
    }

    return [...lines]
      .sort((left, right) => {
        const leftY = left?.box?.[0]?.[1] ?? 0;
        const rightY = right?.box?.[0]?.[1] ?? 0;
        return leftY - rightY;
      })
      .map((line) => line.text)
      .filter(Boolean)
      .join("\n");
  }
}

export default new PaddleOcrClient();
