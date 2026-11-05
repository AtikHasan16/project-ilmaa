/**
 * Utility to extract and parse database / API error details (specifically PostgREST/PostgreSQL errors).
 */

/**
 * Parses PostgreSQL duplicate key constraint detail string
 * e.g. "Key (word, topic)=(paper, Fabrics) already exists."
 * or "Key (word)=(paper) already exists."
 */
export function parseDuplicateDetails(details = "") {
  if (!details || typeof details !== "string") return null;

  const match = details.match(/Key\s*\(([^)]+)\)\s*=\s*\(([^)]+)\)/i);
  if (!match) return null;

  const rawKeys = match[1]
    .split(",")
    .map((k) => k.replace(/["']/g, "").trim().toLowerCase());
  const rawVals = match[2].split(",").map((v) => v.trim());

  const keyMap = {};
  rawKeys.forEach((key, idx) => {
    keyMap[key] = rawVals[idx] || "";
  });

  return {
    word: keyMap.word || "",
    topic: keyMap.topic || "",
    raw: details,
  };
}

/**
 * Normalizes error properties from direct objects or axios/fetch response wrappers
 */
export function extractErrorDetails(err) {
  const rawError = err?.response?.data || err?.error || err || {};
  const code = String(rawError.code || err?.code || "").trim();
  const details = String(rawError.details || err?.details || "").trim();
  const message = String(rawError.message || err?.message || "An unexpected error occurred.").trim();
  const hint = String(rawError.hint || err?.hint || "").trim();

  const isDuplicate =
    code === "23505" ||
    message.toLowerCase().includes("duplicate key") ||
    details.toLowerCase().includes("already exists");

  const duplicateInfo = isDuplicate ? parseDuplicateDetails(details) : null;

  return {
    code,
    details,
    message,
    hint,
    isDuplicate,
    conflictingWord: duplicateInfo?.word || "",
    conflictingTopic: duplicateInfo?.topic || "",
  };
}
