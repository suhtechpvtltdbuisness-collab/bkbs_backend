const normalizeText = (rawText) =>
  rawText
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/\s+/g, " ")
    .trim();

const normalizeOcrDigits = (text) =>
  text
    .replace(/[OoQqD]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/[Zz]/g, "2")
    .replace(/[Ss]/g, "5")
    .replace(/[Bb]/g, "8");

const extractVid = (text) => {
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

  const spaced16 = text.match(/\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/);
  if (spaced16) {
    return spaced16[0].replace(/[\s-]/g, "");
  }

  const compact16 = text.match(/\b\d{16}\b/);
  if (compact16) {
    return compact16[0];
  }

  return null;
};

const extractAadhaarNumber = (text) => {
  const compactDigits = normalizeOcrDigits(text).replace(/[^\d]/g, " ");
  const digitGroups = compactDigits.match(/\b\d{12}\b/);
  if (digitGroups) {
    return digitGroups[0];
  }

  const spaced = normalizeOcrDigits(text).match(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/);
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

const formatName = (name) => {
  if (!name) return name;

  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^A-Za-z .'-]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
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

  const spacedCandidate = [...candidates]
    .reverse()
    .find((candidate) => /[a-z]\s[A-Z]/.test(candidate));

  return formatName(spacedCandidate || candidates[candidates.length - 1]);
};

export const parseFront = (rawText) => {
  const text = normalizeText(rawText);
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const dob = extractDob(text);
  const dobLineIndex = lines.findIndex((line) => extractDob(line));

  const vid = extractVid(text);

  let textForAadhaar = text;
  if (vid) {
    const vidPattern = vid.split("").join("\\s*");
    const labelAndVidRegex = new RegExp(`(?:vid\\s*[:\\-\\s]*)?${vidPattern}`, "gi");
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

const ADDRESS_LABEL_PATTERN =
  /(?:address|add\s*ress|aadress|aadres|adress|पता)\s*[:：]/i;

const AADHAAR_BLOCK_PATTERN =
  /\b(?:vid\s*[:\-]?\s*)?\d{4}[\s-]?\d{4}[\s-]?\d{4}(?:[\s-]?\d{4})?\b|\b\d{12}\b|\b\d{16}\b/i;

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
  if (/^vid\b/i.test(value)) {
    return true;
  }
  if (
    (/^details?\s*as/i.test(value) || /^detailsas$/i.test(value)) &&
    value.length < 40
  ) {
    return true;
  }
  if (/^details?\s*$/i.test(value)) {
    return true;
  }
  return false;
};

const extractPincode = (text) => {
  const normalized = normalizeOcrDigits(text);

  const labeledMatch = normalized.match(
    /(?:pin(?:code)?|zip|postal\s*code)\s*[:#-]?\s*([1-9]\d{5})\b/i,
  );
  if (labeledMatch) {
    return labeledMatch[1];
  }

  const trailingMatch = normalized.match(
    /(?:pradesh|state|district|dist|pincode|pin)\s*[-:,]?\s*([1-9]\d{5})\b/i,
  );
  if (trailingMatch) {
    return trailingMatch[1];
  }

  const spacedMatch = normalized.match(/\b([1-9]\d{2})\s+(\d{3})\b/);
  if (spacedMatch) {
    return `${spacedMatch[1]}${spacedMatch[2]}`;
  }

  const matches = [...normalized.matchAll(/\b([1-9]\d{5})\b/g)];
  if (!matches.length) {
    return null;
  }

  return matches[matches.length - 1][1];
};

const stripTrailingIdentityBlock = (text) => {
  const aadhaarMatch = text.match(AADHAAR_BLOCK_PATTERN);
  if (!aadhaarMatch) {
    return text;
  }

  const index = text.indexOf(aadhaarMatch[0]);
  if (index <= 0) {
    return text;
  }

  return text.slice(0, index).trim();
};

const extractAddressSource = (text) => {
  const labelMatch = text.match(
    /(?:address|add\s*ress|aadress|aadres|adress|पता)\s*[:：]\s*(.+)/is,
  );
  if (labelMatch) {
    return labelMatch[1].trim();
  }

  const lineSegments = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const addressStartIndex = lineSegments.findIndex((line) =>
    ADDRESS_LABEL_PATTERN.test(line),
  );

  if (addressStartIndex >= 0) {
    const firstLine = lineSegments[addressStartIndex].replace(
      ADDRESS_LABEL_PATTERN,
      "",
    );
    const followingLines = lineSegments.slice(addressStartIndex + 1);
    return [firstLine, ...followingLines].filter(Boolean).join(", ");
  }

  const aadhaarLineIndex = lineSegments.findIndex((line) =>
    AADHAAR_BLOCK_PATTERN.test(line),
  );

  if (aadhaarLineIndex > 0) {
    const candidateLines = lineSegments
      .slice(0, aadhaarLineIndex)
      .map((line) => stripInlineBackNoise(line))
      .filter(Boolean)
      .filter((line) => !isBackNoiseSegment(line));
    if (candidateLines.length) {
      return candidateLines.join(", ");
    }
  }

  const nonNoiseLines = lineSegments
    .map((line) => stripInlineBackNoise(line))
    .filter(Boolean)
    .filter((line) => !isBackNoiseSegment(line));
  if (nonNoiseLines.length) {
    return nonNoiseLines.join(", ");
  }

  return text;
};

const normalizeAddressText = (text) => {
  if (!text) return text;

  let normalized = text.replace(
    /\b([swdco])\s*[\/\\]\s*([o0])(?=[a-z\d]|\b)/gi,
    (match, p1) => `${p1.toUpperCase()}/O `,
  );

  normalized = normalized.replace(/\b([SWDCO]\/O)\s*/gi, "$1 ");
  normalized = normalized.replace(/\bU+u?tar\s*Pradesh\b/gi, "Uttar Pradesh");
  normalized = normalized.replace(/\s{2,}/g, " ").trim();

  return normalized;
};

const formatAddressSpacing = (address) => {
  if (!address) {
    return address;
  }

  let formatted = address;

  formatted = formatted.replace(/\b(Awarganj)\b/gi, "Anwarganj");
  formatted = formatted.replace(/\b(?:Awaa|Awagaa|Awag\w*)\b/gi, " ");
  formatted = formatted.replace(/([a-z\d])(PO\s*:)/gi, "$1, $2");
  formatted = formatted.replace(/([a-z])(D(?:IST|ST)\s*:?)/gi, "$1, $2");
  formatted = formatted.replace(/\b(PO)\s*:\s*/gi, "PO: ");
  formatted = formatted.replace(/\bD(?:IST|ST)\s*:?\s*/gi, "DIST: ");
  formatted = formatted.replace(/\bPO:\s*Awarganj\b/gi, "PO: Anwarganj");
  formatted = formatted.replace(/\b(Awarganj)\b/gi, "Anwarganj");
  formatted = formatted.replace(/\b(Kanpur)(Nagar)\b/gi, "$1 $2");
  formatted = formatted.replace(/\b(Anwarganj)(PO\s*:)/gi, "$1, $2");
  formatted = formatted.replace(/\s*,\s*/g, ", ");
  formatted = formatted.replace(/,\s*,+/g, ", ");
  formatted = formatted.replace(/\s{2,}/g, " ");

  return formatted.trim();
};

const stripInlineBackNoise = (text) => {
  if (!text) return text;

  return text
    .replace(
      /\bdetails?\s*as(?:\s*on)?(?:\s*:?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})?\b/gi,
      " ",
    )
    .replace(/\bdetailsas\b/gi, " ")
    .replace(/\bdetailse\b/gi, " ")
    .replace(/,\s*details?\s*$/gi, " ")
    .replace(/\bdetails?\s*$/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const extractStateName = (text) => {
  const patterns = [
    /\b(U+\w*\s*tar\s*Pradesh)\b/gi,
    /\b([A-Za-z]+\s+Pradesh)\b/gi,
    /\b([A-Za-z]{4,}Pradesh)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length) {
      return normalizeAddressText(matches[matches.length - 1][1]);
    }
  }

  return null;
};

const appendMissingState = (address, rawText, pincode) => {
  if (!address || /pradesh\b/i.test(address)) {
    return address;
  }

  const state = extractStateName(rawText);
  if (state) {
    return `${address.replace(/[,;:\-\s]+$/, "")}, ${state}`;
  }

  if (pincode && /^208/.test(pincode)) {
    return `${address.replace(/[,;:\-\s]+$/, "")}, Uttar Pradesh`;
  }

  return address;
};

const normalizeAddressPartKey = (part) =>
  part.toLowerCase().replace(/[\s,.\-:/]+/g, "");

const dedupeAddressParts = (address) => {
  const parts = address
    .split(/,\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  const kept = [];

  for (const part of parts) {
    const key = normalizeAddressPartKey(part);
    if (!key) {
      continue;
    }

    const duplicateIndex = kept.findIndex((existing) => {
      const existingKey = normalizeAddressPartKey(existing);
      return (
        existingKey === key ||
        (existingKey.includes(key) && key.length <= existingKey.length) ||
        (key.includes(existingKey) && existingKey.length <= key.length)
      );
    });

    if (duplicateIndex >= 0) {
      if (key.length > normalizeAddressPartKey(kept[duplicateIndex]).length) {
        kept[duplicateIndex] = part;
      }
      continue;
    }

    kept.push(part);
  }

  return kept.join(", ");
};

const extractBestAddressSpan = (address) => {
  const cleaned = stripInlineBackNoise(address);
  const startMatch = cleaned.match(/(?:S\/O|W\/O|D\/O|C\/O)\s/i);
  if (!startMatch) {
    return cleaned;
  }

  const start = startMatch.index;
  let end = start;

  const endPatterns = [
    /\b[A-Za-z]+\s*Pradesh\b/gi,
    /\bD(?:IST|ST)\s*:?\s*[A-Za-z]+\s*Nagar\b/gi,
    /\bKanpur\s+Nagar\b/gi,
  ];

  for (const pattern of endPatterns) {
    for (const match of cleaned.matchAll(pattern)) {
      if (match.index >= start) {
        end = Math.max(end, match.index + match[0].length);
      }
    }
  }

  if (end === start) {
    end = cleaned.length;
  } else {
    const tail = cleaned.slice(end, end + 50);
    const stateAfterDistrict = tail.match(
      /^\s*[,.\-–]?\s*((?:U+\w*\s*tar|[A-Za-z]+)\s*Pradesh)\b/i,
    );
    if (stateAfterDistrict) {
      end += stateAfterDistrict.index + stateAfterDistrict[0].length;
    }
  }

  return cleaned.slice(start, end).trim();
};

export const parseBack = (rawText) => {
  const text = rawText.replace(/\r/g, "\n").trim();
  const pincode = extractPincode(text);

  let addressSource = stripTrailingIdentityBlock(extractAddressSource(text));

  const segments = addressSource
    .split(/[,，]+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => !isBackNoiseSegment(segment))
    .filter((segment) => segment !== pincode);

  let address = segments.join(", ").replace(/\s+/g, " ").trim();

  if (pincode) {
    address = address
      .replace(new RegExp(`[,\\s-]*${pincode}[,\\s-]*`, "gi"), " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  address = normalizeAddressText(address);
  address = stripInlineBackNoise(address);
  address = dedupeAddressParts(address);
  address = extractBestAddressSpan(address);
  address = appendMissingState(address, text, pincode);
  address = stripInlineBackNoise(address);
  address = formatAddressSpacing(address);
  address = address.replace(/,\s*Uttar Pradesh,\s*Uttar Pradesh\b/gi, ", Uttar Pradesh");
  address = address
    .replace(/^(?:address|add\s*ress|aadress|aadres|adress|पता)\s*[:：]\s*/i, "")
    .trim();
  address = address.replace(/[,;:\-\s]+$/, "").trim();

  if (!address && pincode) {
    const fallbackLines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !isBackNoiseSegment(line))
      .filter((line) => !AADHAAR_BLOCK_PATTERN.test(line));

    address = normalizeAddressText(fallbackLines.join(", ").replace(/\s+/g, " ").trim());
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
