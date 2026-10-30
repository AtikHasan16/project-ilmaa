export function toCamel(value) {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(toCamel);

  const mapped = {};
  for (const [key, child] of Object.entries(value)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase(),
    );
    mapped[camelKey] = child;
  }
  return mapped;
}

export function requireSupabaseUserId(userId) {
  const cleanId = String(userId || "").trim();
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(cleanId)) {
    throw new Error("A valid signed-in Supabase user ID is required.");
  }
  return cleanId;
}
