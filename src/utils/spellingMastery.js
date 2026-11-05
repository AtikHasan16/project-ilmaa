const STORAGE_KEY_PREFIX = "spellycraft-spelling-mastery:v1:";
const OUTCOMES = new Set(["know", "doNotKnow", "forgot"]);

function getStorage(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined") return window.localStorage;
  return null;
}

export function getSpellingMasteryStorageKey(userId) {
  return `${STORAGE_KEY_PREFIX}${encodeURIComponent(userId || "guest")}`;
}

export function loadSpellingMastery(userId, storage) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return {};

  const serialized = targetStorage.getItem(getSpellingMasteryStorageKey(userId));
  if (!serialized) return {};

  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    console.warn("Could not parse saved spelling mastery:", error);
    return {};
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  return Object.fromEntries(
    Object.entries(parsed).map(([topic, records]) => [
      topic,
      records && typeof records === "object" && !Array.isArray(records)
        ? Object.fromEntries(
            Object.entries(records)
              .filter(([, record]) =>
                record &&
                typeof record === "object" &&
                OUTCOMES.has(record.status) &&
                typeof record.word?.word === "string",
              )
              .map(([wordKey, record]) => [
              wordKey,
              {
                ...record,
                attempts: {
                  know: Math.max(0, Number(record.attempts?.know) || 0),
                  doNotKnow: Math.max(
                    0,
                    Number(record.attempts?.doNotKnow) || 0,
                  ),
                  forgot: Math.max(0, Number(record.attempts?.forgot) || 0),
                },
              },
              ]),
          )
        : {},
    ]),
  );
}

export function saveSpellingMastery(userId, mastery, storage) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) {
    throw new Error("Browser storage is not available for spelling mastery.");
  }
  targetStorage.setItem(
    getSpellingMasteryStorageKey(userId),
    JSON.stringify(mastery),
  );
}

export function recordSpellingAttempt(mastery, topic, word, outcome) {
  const cleanTopic = String(topic || "").trim();
  const cleanWord = String(word?.word || "").trim();
  if (!cleanTopic || !cleanWord || !OUTCOMES.has(outcome)) {
    throw new Error("A topic, vocabulary word, and valid result are required.");
  }

  const wordKey = cleanWord.toLocaleLowerCase();
  const previous = mastery[cleanTopic]?.[wordKey];
  const attempts = {
    know: previous?.attempts?.know || 0,
    doNotKnow: previous?.attempts?.doNotKnow || 0,
    forgot: previous?.attempts?.forgot || 0,
  };
  attempts[outcome] += 1;

  return {
    ...mastery,
    [cleanTopic]: {
      ...mastery[cleanTopic],
      [wordKey]: {
        word,
        status: outcome,
        attempts,
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

export function getSpellingMasterySummary(mastery, topic) {
  const records = Object.values(mastery[topic] || {});
  const summary = { know: 0, doNotKnow: 0, forgot: 0, total: records.length };
  for (const record of records) {
    if (OUTCOMES.has(record.status)) summary[record.status] += 1;
  }
  return summary;
}

export function getSpellingMistakes(mastery, topic) {
  return Object.entries(mastery)
    .filter(([recordTopic]) => !topic || recordTopic === topic)
    .flatMap(([recordTopic, records]) =>
      Object.values(records || {})
        .filter((record) => record.status === "doNotKnow" || record.status === "forgot")
        .map((record) => ({ ...record, topic: recordTopic })),
    )
    .sort((a, b) => a.word.word.localeCompare(b.word.word));
}
