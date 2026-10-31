/**
 * Deterministic color-hashing for candidate avatar initials.
 * Generates consistent, high-contrast, editorial palette values from user names.
 */

const PALETTE = [
  { bg: "#6D4E56", text: "#FFFFFF", border: "#583D44", label: "plum" },
  { bg: "#475569", text: "#FFFFFF", border: "#334155", label: "slate" },
  { bg: "#047857", text: "#FFFFFF", border: "#065F46", label: "emerald" },
  { bg: "#B45309", text: "#FFFFFF", border: "#92400E", label: "amber" },
  { bg: "#4338CA", text: "#FFFFFF", border: "#3730A3", label: "indigo" },
  { bg: "#0F766E", text: "#FFFFFF", border: "#115E59", label: "teal" },
  { bg: "#9D174D", text: "#FFFFFF", border: "#831843", label: "rose" },
];

export function getAvatarColor(name = "") {
  const cleanName = String(name || "Candidate").trim();
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash << 5) - hash + cleanName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

export function getInitials(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
