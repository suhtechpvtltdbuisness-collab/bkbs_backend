const normalizeText = (rawText) =>
  rawText
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/\s+/g, " ")
    .trim();

const extractAadhaarNumber = (text) => {
  const compactDigits = text.replace(/[^\d]/g, " ");
  const digitGroups = compactDigits.match(/\d{12}/);
  if (digitGroups) {
    return digitGroups[0];
  }

  const spaced = text.match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/);
  if (spaced) {
    return spaced[0].replace(/[\s-]/g, "");
  }

  return null;
};

const extractDob = (text) => {
  const fullDate = text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
  if (fullDate) {
    return fullDate[1].replace(/-/g, "/");
  }

  const yearOnly = text.match(/\b(19|20)\d{2}\b/);
  return yearOnly ? yearOnly[0] : null;
};

const extractGender = (text) => {
  const match = text.match(/\b(MALE|FEMALE|Male|Female)\b/i);
  if (!match) {
    return null;
  }

  const value = match[1].toLowerCase();
  return value === "male" ? "Male" : "Female";
};

const extractName = (lines, dobLineIndex) => {
  const skipPattern =
    /government|india|aadhaar|aadhar|unique|identification|authority|uidai|dob|year|birth|male|female|\d{4}/i;

  const candidates = lines
    .slice(0, dobLineIndex >= 0 ? dobLineIndex : lines.length)
    .map((line) => line.trim())
    .filter((line) => line.length > 2 && !skipPattern.test(line));

  if (candidates.length === 0) {
    return null;
  }

  return candidates[candidates.length - 1];
};

export const parseFront = (rawText) => {
  const text = normalizeText(rawText);
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const dob = extractDob(text);
  const dobLineIndex = lines.findIndex((line) => extractDob(line));

  return {
    aadhaarNumber: extractAadhaarNumber(text),
    name: extractName(lines, dobLineIndex),
    dob,
    gender: extractGender(text),
  };
};

const BACK_NOISE_SEGMENT =
  /unique|identification|authority|uidai|government\s*of\s*india|aadhaar|aadhar|print\s*date|issue\s*date|help@|www\.|\.gov\.in|^\d{4}$/i;

const isBackNoiseSegment = (segment) => {
  const value = segment.trim();
  if (!value) {
    return true;
  }
  if (/^\d{6}$/.test(value)) {
    return true;
  }
  if (/^\d{4,7}$/.test(value)) {
    return true;
  }
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(value)) {
    return true;
  }
  if (BACK_NOISE_SEGMENT.test(value)) {
    return true;
  }
  if (/@/.test(value)) {
    return true;
  }
  if (/^www\./i.test(value)) {
    return true;
  }
  return false;
};

const extractPincode = (text) => {
  const matches = [...text.matchAll(/\b([1-9]\d{5})\b/g)];
  if (!matches.length) {
    return null;
  }
  return matches[matches.length - 1][1];
};

export const parseBack = (rawText) => {
  const text = rawText.replace(/\r/g, "\n").trim();
  const pincode = extractPincode(text);

  let addressSource = text;
  const addressLabelMatch = text.match(/Address\s*[:：]\s*(.+)/is);
  if (addressLabelMatch) {
    addressSource = addressLabelMatch[1].trim();
  } else {
    const lineSegments = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const nonNoiseLines = lineSegments.filter((line) => !isBackNoiseSegment(line));
    if (nonNoiseLines.length) {
      addressSource = nonNoiseLines.join(", ");
    }
  }

  const segments = addressSource
    .split(/[,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !isBackNoiseSegment(segment))
    .filter((segment) => segment !== pincode);

  let address = segments.join(", ").replace(/\s{2,}/g, " ").trim();

  if (pincode) {
    address = address
      .replace(new RegExp(`[,\\s]*${pincode}[,\\s]*$`), "")
      .trim();
  }

  return {
    address: address || null,
    pincode,
  };
};

export default {
  parseFront,
  parseBack,
};
