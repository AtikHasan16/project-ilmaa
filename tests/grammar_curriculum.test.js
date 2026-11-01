import assert from "node:assert/strict";
import test from "node:test";
import {
  GRAMMAR_LESSONS,
  getLessonByTopicId,
  getDailyGrammarRule,
} from "../src/data/grammarLessonsData.js";

test("GRAMMAR_LESSONS has all 5 canonical IELTS grammar topics", () => {
  assert.equal(GRAMMAR_LESSONS.length, 5, "Must have exactly 5 core grammar lessons");

  const requiredIds = [
    "parallelism",
    "parts-of-speech",
    "singular-plural-nouns",
    "voice-change",
    "modifiers-and-splices",
  ];

  requiredIds.forEach((id) => {
    const lesson = GRAMMAR_LESSONS.find((l) => l.id === id);
    assert.ok(lesson, `Lesson ${id} must exist in catalog`);
    assert.ok(lesson.title, `Lesson ${id} must have a title`);
    assert.ok(lesson.corePrinciple, `Lesson ${id} must have a corePrinciple`);
    assert.ok(lesson.formula, `Lesson ${id} must have a syntax formula`);
    assert.ok(lesson.ieltsImpact, `Lesson ${id} must have an IELTS scoring impact note`);
    assert.ok(lesson.workedExamples?.length >= 2, `Lesson ${id} must have at least 2 worked examples`);
    assert.ok(lesson.contrastivePairs?.length >= 2, `Lesson ${id} must have at least 2 contrastive pairs`);
    assert.ok(lesson.quickCheck?.length >= 2, `Lesson ${id} must have at least 2 quick check questions`);
  });
});

test("quickCheck questions have valid option arrays and correctIndex in range", () => {
  GRAMMAR_LESSONS.forEach((lesson) => {
    lesson.quickCheck.forEach((qc, idx) => {
      assert.ok(qc.question, `Question ${idx} in ${lesson.id} must have text`);
      assert.ok(Array.isArray(qc.options) && qc.options.length >= 2, `Question ${idx} must have >= 2 options`);
      assert.ok(
        qc.correctIndex >= 0 && qc.correctIndex < qc.options.length,
        `Question ${idx} correctIndex must be within options range`
      );
      assert.ok(qc.explanation, `Question ${idx} must have an explanation`);
    });
  });
});

test("getLessonByTopicId returns lesson or null", () => {
  const parallelism = getLessonByTopicId("parallelism");
  assert.ok(parallelism);
  assert.equal(parallelism.id, "parallelism");

  const unknown = getLessonByTopicId("non-existent-topic");
  assert.equal(unknown, null);

  const empty = getLessonByTopicId(null);
  assert.equal(empty, null);
});

test("getDailyGrammarRule returns a deterministic lesson", () => {
  const daily = getDailyGrammarRule();
  assert.ok(daily, "Daily rule must not be null");
  assert.ok(daily.lesson, "Daily rule must have a lesson object");
  assert.ok(daily.formula, "Daily rule must have a formula");
  assert.ok(daily.tip, "Daily rule must have an IELTS tip");
  assert.equal(typeof daily.dayOfYear, "number");
});

test("identificationExercises are structurally sound across all lessons", () => {
  GRAMMAR_LESSONS.forEach((lesson) => {
    assert.ok(
      Array.isArray(lesson.identificationExercises) && lesson.identificationExercises.length >= 2,
      `Lesson ${lesson.id} must have at least 2 identification exercises`
    );

    lesson.identificationExercises.forEach((ex, exIdx) => {
      assert.ok(ex.prompt, `Exercise ${exIdx} in ${lesson.id} must have a prompt`);
      assert.ok(Array.isArray(ex.sentences) && ex.sentences.length >= 2, `Exercise ${exIdx} must have sentences`);
      const errorSentences = ex.sentences.filter((s) => s.isError === true);
      assert.equal(
        errorSentences.length,
        1,
        `Exercise ${exIdx} in ${lesson.id} must have exactly one error sentence to identify`
      );
      ex.sentences.forEach((s) => {
        assert.ok(s.text, "Sentence must have text");
        assert.ok(s.explanation, "Sentence must have an explanation");
      });
    });
  });
});
