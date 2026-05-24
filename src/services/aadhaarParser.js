const normalizeText = (rawText) =>
  rawText
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/\s+/g, " ")
    .trim();

const extractVid = (text) => {
  // 1. Look for patterns with explicit 'VID' prefix first
  const vidRegexes = [
    /vid\s*[:\-]?\s*(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/i,
    /vid\s+(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/i,
  ];
  for (const regex of vidRegexes) {
    const match = text.match(regex);
    if (match) {
      return match[1].replace(/[\s-]/g, "");
    }
  }

  // 2. Look for any 16-digit block with spaces/dashes
  const spaced16 = text.match(/\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/);
  if (spaced16) {
    return spaced16[0].replace(/[\s-]/g, "");
  }

  // 3. Look for a contiguous 16-digit number
  const compact16 = text.match(/\b\d{16}\b/);
  if (compact16) {
    return compact16[0];
  }

  return null;
};

const extractAadhaarNumber = (text) => {
  const compactDigits = text.replace(/[^\d]/g, " ");
  const digitGroups = compactDigits.match(/\b\d{12}\b/);
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

  // Extract VID first
  const vid = extractVid(text);

  // Clean text by removing VID before searching for Aadhaar number
  let textForAadhaar = text;
  if (vid) {
    const vidPattern = vid.split("").join("\\s*");
    const labelAndVidRegex = new RegExp(`(?:vid\\s*[:\\-\\s]*)?${vidPattern}`, 'gi');
    textForAadhaar = text.replace(labelAndVidRegex, " ");
  }

  const aadhaarNumber = extractAadhaarNumber(textForAadhaar);

  return {
    aadhaarNumber,
    vid,
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

const normalizeAddressText = (text) => {
  if (!text) return text;

  // 1. Normalize S/O, W/O, D/O, C/O and all their variations (e.g., S/0, s/0, S\/O, s\/o, S/o, s/o, etc.)
  // Matches word boundary, followed by S, W, D, C, or O, followed by slash/backslash with optional spaces, followed by O or 0.
  // Using lookahead to handle both spaced and merged scenarios.
  let normalized = text.replace(
    /\b([swdco])\s*[\/\\]\s*([o0])(?=[a-z\d]|\b)/gi,
    (match, p1, p2) => {
      return `${p1.toUpperCase()}/O `;
    }
  );

  // 2. Ensure exactly one space after any S/O, W/O, D/O, C/O (e.g., "S/O" -> "S/O ", but "S/O " -> "S/O ")
  normalized = normalized.replace(/\b([SWDCO]\/O)\s*/gi, "$1 ");

  // 3. Clean up double spaces or consecutive spaces
  normalized = normalized.replace(/\s{2,}/g, " ").trim();

  return normalized;
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

  // Replace all whitespace (including newlines) with a single space when joining
  let address = segments.join(", ").replace(/\s+/g, " ").trim();

  if (pincode) {
    address = address
      .replace(new RegExp(`[,\\s]*${pincode}[,\\s]*$`), "")
      .trim();
  }

  // Normalize the address fields to fix common OCR issues
  address = normalizeAddressText(address);

  // Strip trailing punctuation characters (e.g. trailing comma, hyphen, colon)
  address = address.replace(/[,;:\-\s]+$/, "").trim();

  return {
    address: address || null,
    pincode,
  };
};

export default {
  parseFront,
  parseBack,
};
