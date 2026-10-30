import assert from "node:assert/strict";
import test from "node:test";
import { secureShuffle, secureRandomUUID } from "../src/utils/cryptoRandom.js";
import { telemetry } from "../src/services/telemetryService.js";

test("secureShuffle uniformly shuffles array without mutating original", () => {
  const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled = secureShuffle(original);

  assert.equal(shuffled.length, original.length);
  assert.deepEqual([...shuffled].sort((a, b) => a - b), original);
  // Ensure original array was not mutated in place
  assert.equal(original[0], 1);
  assert.equal(original[9], 10);
});

test("secureShuffle gracefully handles empty and single-element arrays", () => {
  assert.deepEqual(secureShuffle([]), []);
  assert.deepEqual(secureShuffle([42]), [42]);
  assert.deepEqual(secureShuffle(null), []);
});

test("secureRandomUUID generates valid RFC4122 v4 UUIDs", () => {
  const uuid = secureRandomUUID();
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assert.ok(uuidRegex.test(uuid), `Generated UUID is invalid: ${uuid}`);
});

test("telemetry logs and buffers events with system version", () => {
  const authEvent = telemetry.trackAuthFailure("test_invalid_credentials", {
    email: "student@example.com",
  });
  assert.equal(authEvent.category, "auth_failure");
  assert.equal(authEvent.version, "1.0.0");
  assert.equal(authEvent.reason, "test_invalid_credentials");

  const quotaEvent = telemetry.trackQuotaRejection("user-uuid-123", 200, 200);
  assert.equal(quotaEvent.category, "quota_rejection");
  assert.equal(quotaEvent.count, 200);

  const ttsEvent = telemetry.trackTtsPerformance({
    durationMs: 150,
    success: true,
    voice: "en-US-ChristopherNeural",
  });
  assert.equal(ttsEvent.category, "tts_metric");
  assert.equal(ttsEvent.success, true);

  const buffered = telemetry.getBufferedEvents();
  assert.ok(buffered.length >= 3);
});
