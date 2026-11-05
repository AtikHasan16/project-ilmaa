function normalizeWords(words) {
  return Array.isArray(words) ? words.filter((word) => typeof word === "string") : [];
}

function removeWord(words, word) {
  const key = word.toLocaleLowerCase();
  return words.filter((entry) => entry.toLocaleLowerCase() !== key);
}

function addWord(words, word) {
  return words.some((entry) => entry.toLocaleLowerCase() === word.toLocaleLowerCase())
    ? words
    : [...words, word];
}

export function reconcileDashboardProgress(
  spellingRows = [],
  flashcardRows = [],
  spellingMastery = {},
  flashcardMastery = {},
) {
  const spellingByTopic = new Map(
    spellingRows.map((row) => [
      row.topic,
      {
        ...row,
        masteredWords: normalizeWords(row.masteredWords),
        incorrectWords: normalizeWords(row.incorrectWords),
      },
    ]),
  );
  const flashcardByTopic = new Map(
    flashcardRows.map((row) => [
      row.topic,
      {
        ...row,
        knownWords: normalizeWords(row.knownWords),
        unknownWords: normalizeWords(row.unknownWords),
        forgotWords: normalizeWords(row.forgotWords),
      },
    ]),
  );

  const latestAttempts = new Map();
  const recordAttempts = (mastery, type) => {
    for (const [topic, records] of Object.entries(mastery || {})) {
      for (const record of Object.values(records || {})) {
        const word = record.word?.word?.trim();
        if (!word) continue;

        const key = `${topic}:${word.toLocaleLowerCase()}`;
        const previous = latestAttempts.get(key);
        const updatedAt = Date.parse(record.updatedAt || "") || 0;
        if (!previous || updatedAt >= previous.updatedAt) {
          latestAttempts.set(key, {
            topic,
            word,
            status: record.status,
            type,
            updatedAt,
          });
        }
      }
    }
  };
  recordAttempts(spellingMastery, "spelling");
  recordAttempts(flashcardMastery, "flashcard");

  for (const { topic, word, status, type } of latestAttempts.values()) {
    const spelling = spellingByTopic.get(topic) || {
      topic,
      masteredWords: [],
      incorrectWords: [],
    };
    const flashcard = flashcardByTopic.get(topic) || {
      topic,
      knownWords: [],
      unknownWords: [],
      forgotWords: [],
    };

    spelling.masteredWords = removeWord(spelling.masteredWords, word);
    spelling.incorrectWords = removeWord(spelling.incorrectWords, word);
    flashcard.knownWords = removeWord(flashcard.knownWords, word);
    flashcard.unknownWords = removeWord(flashcard.unknownWords, word);
    flashcard.forgotWords = removeWord(flashcard.forgotWords, word);

    if (status === "know" || status === "knew") {
      spelling.masteredWords = addWord(spelling.masteredWords, word);
      flashcard.knownWords = addWord(flashcard.knownWords, word);
    } else if (status === "doNotKnow") {
      spelling.incorrectWords = addWord(spelling.incorrectWords, word);
    } else if (status === "unknown") {
      flashcard.unknownWords = addWord(flashcard.unknownWords, word);
    } else if (status === "forgot" && type === "flashcard") {
      flashcard.forgotWords = addWord(flashcard.forgotWords, word);
    } else if (status === "forgot") {
      spelling.incorrectWords = addWord(spelling.incorrectWords, word);
    }

    spellingByTopic.set(topic, spelling);
    flashcardByTopic.set(topic, flashcard);
  }

  return {
    spellingByTopic: Object.fromEntries(spellingByTopic),
    flashcardByTopic: Object.fromEntries(flashcardByTopic),
  };
}
