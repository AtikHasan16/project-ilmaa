import assert from "node:assert/strict";
import test from "node:test";
import { requireSupabaseUserId, toCamel } from "../src/services/dataMappers.js";

test("maps database rows and preserves the canonical id field", () => {
  assert.deepEqual(
    toCamel([
      {
        id: "word-1",
        bangla_meaning: "meaning",
        target_tab: "uploaded",
        uploaded_by_id: "user-1",
      },
      { id: "word-2", created_at: "today" },
    ]),
    [
      {
        id: "word-1",
        banglaMeaning: "meaning",
        targetTab: "uploaded",
        uploadedById: "user-1",
      },
      { id: "word-2", createdAt: "today" },
    ],
  );
});

test("requires a UUID for user-scoped progress", () => {
  const validId = "1b671a64-40d5-491e-99b0-da01ff1f3341";
  assert.equal(requireSupabaseUserId(validId), validId);
  assert.throws(() => requireSupabaseUserId("candidate-123"), /valid signed-in/);
});
