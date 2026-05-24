import fs from "fs/promises";
import { ApiError } from "../utils/apiResponse.js";
import { parseFront, parseBack } from "./aadhaarParser.js";
import paddleOcrClient from "./paddleOcrClient.js";

const getFileBuffer = async (file) => {
  if (file.buffer) {
    return file.buffer;
  }

  if (file.path) {
    return fs.readFile(file.path);
  }

  throw new ApiError(400, "Invalid file upload");
};

const runOcr = async (file) => {
  const buffer = await getFileBuffer(file);
  const ocrResult = await paddleOcrClient.recognize(
    buffer,
    file.mimetype,
    file.originalname,
  );

  return ocrResult.text || paddleOcrClient.linesToText(ocrResult.lines || []);
};

class OcrService {
  async extractFront(file) {
    const rawText = await runOcr(file);
    const parsed = parseFront(rawText);

    if (!parsed.aadhaarNumber && !parsed.vid) {
      throw new ApiError(
        422,
        "Could not extract Aadhaar number or VID from front image. Please upload a clearer photo.",
      );
    }

    return {
      aadhaarNumber: parsed.aadhaarNumber,
      vid: parsed.vid,
      name: parsed.name,
      dob: parsed.dob,
      gender: parsed.gender,
    };
  }

  async extractBack(file) {
    const rawText = await runOcr(file);
    const parsed = parseBack(rawText);

    if (!parsed.address && !parsed.pincode) {
      throw new ApiError(
        422,
        "Could not extract address from back image. Please upload a clearer photo.",
      );
    }

    return {
      address: parsed.address,
      pincode: parsed.pincode,
    };
  }
}

export default new OcrService();
