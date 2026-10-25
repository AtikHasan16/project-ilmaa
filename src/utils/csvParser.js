/**
 * Utility to parse TSV (Google Sheets/Docs copy-paste) and CSV data
 * Database order:
 * Column 1: word
 * Column 2: pos (Part of Speech)
 * Column 3: banglaMeaning
 * Column 4: synonyms (comma, pipe, or semicolon separated)
 * Column 5: exampleUsage
 * Column 6: topic (Optional, defaults to "Uploaded")
 */
export function parseDelimitedText(text, defaultTopic = "Uploaded") {
  if (!text || !text.trim()) return [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const parsedItems = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect delimiter: tab (TSV from Google Sheets) or comma (CSV)
    let cells;
    if (line.includes("\t")) {
      cells = line.split("\t");
    } else {
      // Standard CSV parsing with quotation handling
      cells = parseCsvLine(line);
    }

    cells = cells.map((c) => c.replace(/^["']|["']$/g, "").trim());

    // Skip header row if detected
    if (i === 0) {
      const lowerFirst = (cells[0] || "").toLowerCase();
      if (
        lowerFirst === "word" ||
        lowerFirst === "target word" ||
        lowerFirst === "vocab"
      ) {
        continue;
      }
    }

    const word = cells[0] || "";
    const pos = cells[1] || "Adjective";
    const banglaMeaning = cells[2] || "";
    const synonymsRaw = cells[3] || "";
    const exampleUsage = cells[4] || "";
    const topic = cells[5] || defaultTopic || "Uploaded";

    if (word && banglaMeaning) {
      parsedItems.push({
        word,
        pos,
        banglaMeaning,
        synonyms: synonymsRaw
          ? synonymsRaw
              .split(/[,|;]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        exampleUsage,
        topic,
      });
    }
  }

  return parsedItems;
}

/**
 * Robust CSV line parser supporting quoted fields with commas
 */
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
