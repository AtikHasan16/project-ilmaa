import assert from "node:assert/strict";
import test from "node:test";
import { BADGE_CATALOG } from "../src/services/badgeService.js";
import { getAvatarColor, getInitials } from "../src/utils/avatarColors.js";
import { escapeHtml } from "../src/utils/escapeHtml.js";

test("BADGE_CATALOG has unique keys and valid schema", () => {
  assert.ok(BADGE_CATALOG.length >= 10, "Catalog should have at least 10 badges");
  const keys = new Set();
  BADGE_CATALOG.forEach((badge) => {
    assert.ok(badge.key, "Each badge must have a key");
    assert.ok(badge.title, "Each badge must have a title");
    assert.ok(badge.description, "Each badge must have a description");
    assert.ok(badge.category, "Each badge must have a category");
    assert.ok(badge.tier, "Each badge must have a tier");
    assert.ok(!keys.has(badge.key), `Duplicate badge key detected: ${badge.key}`);
    keys.add(badge.key);
  });
});

test("getAvatarColor generates deterministic palettes", () => {
  const color1 = getAvatarColor("Ahasan Naeem");
  const color2 = getAvatarColor("Ahasan Naeem");
  assert.deepEqual(color1, color2, "Color hashing must be deterministic for identical input");
  assert.ok(color1.bg.startsWith("#"), "Background color should be a hex code");
  assert.equal(color1.text, "#FFFFFF", "Text color must be white for high contrast");
});

test("getInitials formats name initials correctly", () => {
  assert.equal(getInitials("Ahasan Naeem"), "AN");
  assert.equal(getInitials("Vance"), "VA");
  assert.equal(getInitials("John Ronald Reuel Tolkien"), "JT");
  assert.equal(getInitials(""), "U");
  assert.equal(getInitials(null), "U");
});

test("Certificate template escaping protects against HTML injection in candidate names", () => {
  const maliciousName = '<script>alert("xss")</script>Dr. Vance';
  const escaped = escapeHtml(maliciousName);
  assert.ok(!escaped.includes("<script>"), "Must escape opening script tags");
  assert.ok(escaped.includes("&lt;script&gt;"), "Must convert angle brackets to entities");
});
