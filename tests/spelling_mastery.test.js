import assert from "node:assert/strict";
import test from "node:test";
import { secureShuffle } from "../src/utils/cryptoRandom.js";
import {
  getSpellingMasteryStorageKey,
  getSpellingMasterySummary,
  getSpellingMistakes,
  loadSpellingMastery,
  recordSpellingAttempt,
  saveSpellingMastery,
} from "../src/utils/spellingMastery.js";

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

test("secureShuffle shuffles the full array without mutating its input", () => {
  const originalWindow = globalThis.window;
  const randomValues = [0, 0, 0];
  globalThis.window = {
    crypto: {
      getRandomValues(buffer) {
        buffer[0] = randomValues.shift();
        return buffer;
      },
    },
  };

  try {
    const corpus = ["first", "second", "third", "fourth"];
    const shuffled = secureShuffle(corpus);
    assert.deepEqual(shuffled, ["second", "third", "fourth", "first"]);
    assert.deepEqual(corpus, ["first", "second", "third", "fourth"]);
    assert.notDeepEqual(shuffled.slice(0, 2), corpus.slice(0, 2));
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});

test("spelling mastery persists latest categories and attempt history per user", () => {
  const storage = createMemoryStorage();
  const userId = "user-1";
  const topic = "Academic Word List";
  const word = { id: "word-1", word: "analysis", banglaMeaning: "বিশ্লেষণ" };
  let mastery = {};

  mastery = recordSpellingAttempt(mastery, topic, word, "doNotKnow");
  mastery = recordSpellingAttempt(mastery, topic, word, "know");
  mastery = recordSpellingAttempt(mastery, topic, { word: "approach" }, "forgot");
  saveSpellingMastery(userId, mastery, storage);

  const restored = loadSpellingMastery(userId, storage);
  assert.deepEqual(getSpellingMasterySummary(restored, topic), {
    know: 1,
    doNotKnow: 0,
    forgot: 1,
    total: 2,
  });
  assert.deepEqual(
    restored[topic].analysis.attempts,
    { know: 1, doNotKnow: 1, forgot: 0 },
  );
  assert.deepEqual(
    getSpellingMistakes(restored, topic).map((entry) => entry.word.word),
    ["approach"],
  );
  assert.deepEqual(loadSpellingMastery("another-user", storage), {});
  assert.equal(
    getSpellingMasteryStorageKey(userId),
    "spellycraft-spelling-mastery:v1:user-1",
  );
});

test("a correct practice result removes a word from the mistakes collection", () => {
  const topic = "Listening";
  const word = { word: "curriculum" };
  const incorrect = recordSpellingAttempt({}, topic, word, "doNotKnow");
  assert.equal(getSpellingMistakes(incorrect, topic).length, 1);

  const corrected = recordSpellingAttempt(incorrect, topic, word, "know");
  assert.equal(getSpellingMistakes(corrected, topic).length, 0);
  assert.deepEqual(getSpellingMasterySummary(corrected, topic), {
    know: 1,
    doNotKnow: 0,
    forgot: 0,
    total: 1,
  });
});
