import assert from "node:assert/strict";
import test from "node:test";
import { reconcileDashboardProgress } from "../src/utils/dashboardProgress.js";

test("latest local success clears stale server mistakes from both practice modes", () => {
  const { spellingByTopic, flashcardByTopic } = reconcileDashboardProgress(
    [{ topic: "Academic", masteredWords: [], incorrectWords: ["Analysis"] }],
    [{ topic: "Academic", knownWords: [], unknownWords: ["Analysis"], forgotWords: [] }],
    {
      Academic: {
        analysis: {
          word: { word: "analysis" },
          status: "know",
          updatedAt: "2026-11-05T10:00:00.000Z",
        },
      },
    },
  );

  assert.deepEqual(spellingByTopic.Academic.incorrectWords, []);
  assert.deepEqual(flashcardByTopic.Academic.unknownWords, []);
  assert.deepEqual(spellingByTopic.Academic.masteredWords, ["analysis"]);
  assert.deepEqual(flashcardByTopic.Academic.knownWords, ["analysis"]);
});

test("latest local mistake overrides an older correct result without duplicate words", () => {
  const { spellingByTopic, flashcardByTopic } = reconcileDashboardProgress(
    [{ topic: "Academic", masteredWords: ["analysis"], incorrectWords: [] }],
    [{ topic: "Academic", knownWords: ["analysis"], unknownWords: [], forgotWords: [] }],
    {
      Academic: {
        analysis: {
          word: { word: "ANALYSIS" },
          status: "doNotKnow",
          updatedAt: "2026-11-05T11:00:00.000Z",
        },
      },
    },
    {
      Academic: {
        analysis: {
          word: { word: "analysis" },
          status: "knew",
          updatedAt: "2026-11-05T10:00:00.000Z",
        },
      },
    },
  );

  assert.deepEqual(spellingByTopic.Academic.incorrectWords, ["ANALYSIS"]);
  assert.deepEqual(spellingByTopic.Academic.masteredWords, []);
  assert.deepEqual(flashcardByTopic.Academic.knownWords, []);
});
