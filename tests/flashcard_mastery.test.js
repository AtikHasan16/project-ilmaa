import assert from "node:assert/strict";
import test from "node:test";
import {
  getFlashcardMasteryStorageKey,
  getFlashcardMasterySummary,
  getFlashcardMistakes,
  loadFlashcardMastery,
  recordFlashcardAttempt,
  saveFlashcardMastery,
} from "../src/utils/flashcardMastery.js";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) || null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("flashcard results persist latest mastery category and attempt history by user", () => {
  const storage = createMemoryStorage();
  let mastery = {};
  const word = { id: "word-1", word: "analysis", banglaMeaning: "meaning" };

  mastery = recordFlashcardAttempt(mastery, "Academic", word, "unknown");
  mastery = recordFlashcardAttempt(mastery, "Academic", word, "knew");
  mastery = recordFlashcardAttempt(mastery, "Academic", { word: "approach" }, "forgot");
  saveFlashcardMastery("user-1", mastery, storage);

  const restored = loadFlashcardMastery("user-1", storage);
  assert.deepEqual(getFlashcardMasterySummary(restored, "Academic"), {
    knew: 1,
    unknown: 0,
    forgot: 1,
    total: 2,
  });
  assert.deepEqual(restored.Academic.analysis.attempts, {
    knew: 1,
    unknown: 1,
    forgot: 0,
  });
  assert.deepEqual(
    getFlashcardMistakes(restored, "Academic").map((entry) => entry.word.word),
    ["approach"],
  );
  assert.deepEqual(loadFlashcardMastery("user-2", storage), {});
  assert.equal(
    getFlashcardMasteryStorageKey("user-1"),
    "spellycraft-flashcard-mastery:v1:user-1",
  );
});

test("rating a mistake as known removes it from the review list", () => {
  const unknown = recordFlashcardAttempt({}, "Listening", { word: "tuition" }, "unknown");
  const forgotten = recordFlashcardAttempt(unknown, "Listening", { word: "semester" }, "forgot");
  assert.equal(getFlashcardMistakes(forgotten, "Listening").length, 2);

  const corrected = recordFlashcardAttempt(forgotten, "Listening", { word: "tuition" }, "knew");
  assert.deepEqual(
    getFlashcardMistakes(corrected, "Listening").map((entry) => entry.word.word),
    ["semester"],
  );
});
