import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseDuplicateDetails, extractErrorDetails } from "../src/utils/errorParser.js";

describe("errorParser - Duplicate & PostgreSQL Detail Extraction", () => {
  it("correctly extracts word and topic from compound unique violation details", () => {
    const details = "Key (word, topic)=(paper, Fabrics) already exists.";
    const result = parseDuplicateDetails(details);

    assert.ok(result);
    assert.equal(result.word, "paper");
    assert.equal(result.topic, "Fabrics");
  });

  it("handles single-key unique violation details", () => {
    const details = "Key (word)=(ubiquitous) already exists.";
    const result = parseDuplicateDetails(details);

    assert.ok(result);
    assert.equal(result.word, "ubiquitous");
    assert.equal(result.topic, "");
  });

  it("handles quoted columns and extra whitespace", () => {
    const details = 'Key ("word", "topic") = ( meticulously , Academic Lexicon ) already exists.';
    const result = parseDuplicateDetails(details);

    assert.ok(result);
    assert.equal(result.word, "meticulously");
    assert.equal(result.topic, "Academic Lexicon");
  });

  it("extracts full error details from Supabase PostgrestError object", () => {
    const pgError = {
      code: "23505",
      details: "Key (word, topic)=(paper, Fabrics) already exists.",
      hint: null,
      message: 'duplicate key value violates unique constraint "idx_vocabularies_word_topic"',
    };

    const extracted = extractErrorDetails(pgError);
    assert.equal(extracted.code, "23505");
    assert.equal(extracted.details, "Key (word, topic)=(paper, Fabrics) already exists.");
    assert.equal(extracted.message, 'duplicate key value violates unique constraint "idx_vocabularies_word_topic"');
    assert.equal(extracted.isDuplicate, true);
    assert.equal(extracted.conflictingWord, "paper");
    assert.equal(extracted.conflictingTopic, "Fabrics");
  });

  it("gracefully handles non-duplicate and nullish errors", () => {
    const genericError = new Error("Network connection dropped");
    const extracted = extractErrorDetails(genericError);

    assert.equal(extracted.isDuplicate, false);
    assert.equal(extracted.message, "Network connection dropped");
    assert.equal(extracted.conflictingWord, "");
    assert.equal(extracted.details, "");
  });
});
