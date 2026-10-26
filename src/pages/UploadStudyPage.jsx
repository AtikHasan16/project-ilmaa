import { useState, useRef } from "react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import {
  HiCloudArrowUp,
  HiDocumentText,
  HiDocumentArrowUp,
  HiTableCells,
  HiCheckCircle,
  HiShieldCheck,
} from "react-icons/hi2";
import {
  showConfirmModal,
  showSuccessToast,
  showErrorAlert,
} from "../utils/sweetalert";
import { parseDelimitedText } from "../utils/csvParser";

export default function UploadStudyPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState("bulk"); // 'bulk' | 'single'

  // Destination tab: 'active' (All Active corpus) vs 'uploaded' (Uploaded corpus)
  const [targetDestination, setTargetDestination] = useState("active");

  // Single upload state
  const [word, setWord] = useState("");
  const [pos, setPos] = useState("Adjective");
  const [banglaMeaning, setBanglaMeaning] = useState("");
  const [synonyms, setSynonyms] = useState("");
  const [exampleUsage, setExampleUsage] = useState("");
  const [topic, setTopic] = useState("Academic Word List: Sublist A");

  // Bulk upload state
  const [rawText, setRawText] = useState("");
  const [bulkTopic, setBulkTopic] = useState("Academic Word List: Sublist A");
  const [previewItems, setPreviewItems] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const fileInputRef = useRef(null);

  // Handle single word upload
  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (!word.trim() || !banglaMeaning.trim()) {
      showErrorAlert(
        "Missing Fields",
        "Target word and Bengali meaning are required.",
      );
      return;
    }

    setImporting(true);
    try {
      const selectedTopic = topic.trim() || (targetDestination === "active" ? "Academic Word List: Sublist A" : "Uploaded");
      const res = await apiClient.post("/vocabulary", {
        word: word.trim(),
        pos,
        banglaMeaning: banglaMeaning.trim(),
        synonyms: synonyms
          .split(/[,|;]/)
          .map((s) => s.trim())
          .filter(Boolean),
        exampleUsage: exampleUsage.trim(),
        topic: selectedTopic,
        targetTab: targetDestination,
        uploadedBy: isAdmin ? "admin" : (user?.name || "user-upload"),
      });

      if (res.data?.success) {
        showSuccessToast(
          "Word Added!",
          `"${word.trim()}" successfully saved to ${targetDestination === "active" ? "All Active" : "Uploaded"} (${selectedTopic}).`,
        );
        setWord("");
        setBanglaMeaning("");
        setSynonyms("");
        setExampleUsage("");
      }
    } catch (err) {
      showErrorAlert(
        "Upload Failed",
        err.response?.data?.message || err.message,
      );
    } finally {
      setImporting(false);
    }
  };

  // Parse raw text whenever user pastes or edits textarea
  const handleTextChange = (e) => {
    const text = e.target.value;
    setRawText(text);
    const parsed = parseDelimitedText(text, bulkTopic);
    setPreviewItems(parsed);
    setImportResult(null);
  };

  // File upload trigger (.csv or .tsv)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setRawText(content);
        const parsed = parseDelimitedText(content, bulkTopic);
        setPreviewItems(parsed);
        showSuccessToast(
          "File Loaded",
          `Parsed ${parsed.length} entries from "${file.name}".`,
        );
      }
    };
    reader.onerror = () => {
      showErrorAlert("File Error", "Failed to read the selected file.");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Perform bulk array POST to server
  const handleBulkSubmit = async () => {
    if (previewItems.length === 0) {
      showErrorAlert(
        "Empty Import",
        "Please paste valid tabular data or upload a CSV file first.",
      );
      return;
    }

    const destLabel = targetDestination === "active" ? "All Active Corpus" : "Uploaded Corpus";
    const confirmRes = await showConfirmModal({
      title: "Confirm Bulk Import?",
      text: `Upload ${previewItems.length} vocabulary entries into [${destLabel}] under "${bulkTopic}"?`,
      confirmButtonText: "Start Import",
      icon: "question",
    });

    if (!confirmRes.isConfirmed) return;

    setImporting(true);
    setImportResult(null);

    try {
      const res = await apiClient.post("/vocabulary/bulk", {
        items: previewItems,
        defaultTopic: bulkTopic,
        targetTab: targetDestination,
        uploadedBy: isAdmin ? "admin" : (user?.name || "bulk-sheet-import"),
      });

      if (res.data?.success) {
        setImportResult(res.data);
        showSuccessToast("Import Complete", res.data.message);
        setRawText("");
        setPreviewItems([]);
      }
    } catch (err) {
      showErrorAlert(
        "Bulk Import Error",
        err.response?.data?.message || err.message,
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between  pb-4 border-b border-plum/15">
        <div>
          <h2 className="text-3xl font-black text-body-dark tracking-tight">
            Upload to Study
          </h2>
          <p className="text-lg text-muted-label mt-1">
            Import from Google Sheets and CSV files.
          </p>
        </div>

        {/* Tab Switcher: Bulk Import vs Single Word */}
        <div className="flex items-center  space-x-2 bg-plum/5 p-1 rounded-xl border border-plum/20">
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === "bulk"
                ? "bg-plum text-white shadow-xs"
                : "text-muted-label hover:text-body-dark"
            }`}
          >
            <HiTableCells className="w-5 h-5" />
            <span>Bulk Import</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2 rounded-lg text-base font-semibold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === "single"
                ? "bg-plum text-white shadow-xs"
                : "text-muted-label hover:text-body-dark"
            }`}
          >
            <HiDocumentText className="w-5 h-5" />
            <span>Single Entry</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODE 1: BULK IMPORT (TSV & CSV)                      */}
      {/* ==================================================== */}
      {activeTab === "bulk" && (
        <div className="flex flex-col space-y-6">
          {/* Instructions Box */}
          <div className="imlaa-card p-5 border border-plum/20 bg-plum/5">
            <h4 className="text-base font-bold text-plum uppercase tracking-wider mb-2">
              Expected Column Order (Database Standard)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-sm font-mono text-body-dark">
              <span className="p-2 rounded bg-white border border-plum/15 font-bold">
                1. Word *
              </span>
              <span className="p-2 rounded bg-white border border-plum/15 font-bold">
                2. POS
              </span>
              <span className="p-2 rounded bg-white border border-plum/15 font-bold">
                3. Meaning *
              </span>
              <span className="p-2 rounded bg-white border border-plum/15">
                4. Synonyms
              </span>
              <span className="p-2 rounded bg-white border border-plum/15">
                5. Example
              </span>
              <span className="p-2 rounded bg-white border border-plum/15">
                6. Topic
              </span>
            </div>
            <p className="text-sm text-muted-label mt-2">
              Tip: In Google Sheets or Excel, select your cells and press{" "}
              <strong>Ctrl+C</strong>, then paste directly into the box below.
            </p>
          </div>

          {/* Input & Upload Controls */}
          <div className="imlaa-card p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-base font-bold text-body-dark">
                  Paste TSV Data or Upload CSV File
                </label>
                <span className="text-sm text-muted-label">
                  Supports Tab-Separated Values (Google Docs/Sheets) and
                  comma-separated CSV.
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="imlaa-btn-secondary py-2 px-4 text-base space-x-2"
                >
                  <HiDocumentArrowUp className="w-5 h-5" />
                  <span>Upload .CSV File</span>
                </button>
              </div>
            </div>

            {/* Target Corpus Destination Selector (Admin / Active vs Uploaded) */}
            <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <HiShieldCheck className={`w-5 h-5 ${isAdmin ? "text-plum" : "text-muted-label"}`} />
                <span className="text-base font-bold text-body-dark">
                  Target Corpus Destination:
                </span>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-plum/10 text-plum text-xs font-bold">
                    Admin Privileges
                  </span>
                )}
              </div>

              <div className="inline-flex items-center bg-white p-1 rounded-xl border border-plum/20 shadow-xs flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setTargetDestination("active");
                    setBulkTopic("Academic Word List: Sublist A");
                    if (rawText) {
                      setPreviewItems(
                        parseDelimitedText(rawText, "Academic Word List: Sublist A"),
                      );
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    targetDestination === "active"
                      ? "bg-plum text-white shadow-xs font-bold"
                      : "text-muted-label hover:text-body-dark"
                  }`}
                >
                  All Active Tab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetDestination("listening");
                    setBulkTopic("Studying university/college");
                    if (rawText) {
                      setPreviewItems(
                        parseDelimitedText(rawText, "Studying university/college"),
                      );
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    targetDestination === "listening"
                      ? "bg-plum text-white shadow-xs font-bold"
                      : "text-muted-label hover:text-body-dark"
                  }`}
                >
                  Listening Vocabs Tab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetDestination("uploaded");
                    setBulkTopic("Uploaded Custom Topic");
                    if (rawText) {
                      setPreviewItems(
                        parseDelimitedText(rawText, "Uploaded Custom Topic"),
                      );
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    targetDestination === "uploaded"
                      ? "bg-plum text-white shadow-xs font-bold"
                      : "text-muted-label hover:text-body-dark"
                  }`}
                >
                  Uploaded Tab
                </button>
              </div>
            </div>

            {/* Target Category Selector: Custom Input Box with Quick Suggestion Badges */}
            <div className="flex flex-col space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-base font-semibold text-body-dark shrink-0">
                  {targetDestination === "active"
                    ? "Active Topic Name:"
                    : targetDestination === "listening"
                      ? "Listening Topic Title:"
                      : "Custom Uploaded Topic Name:"}
                </label>
                <input
                  type="text"
                  value={bulkTopic}
                  onChange={(e) => {
                    setBulkTopic(e.target.value);
                    if (rawText) {
                      setPreviewItems(
                        parseDelimitedText(rawText, e.target.value || "Custom Study"),
                      );
                    }
                  }}
                  placeholder={
                    targetDestination === "active"
                      ? "Academic Word List: Sublist A"
                      : targetDestination === "listening"
                        ? "e.g. Studying university/college, Subjects..."
                        : "e.g. My IELTS Vocabulary, Medical Terms..."
                  }
                  className="imlaa-input text-base py-2 px-3 flex-1"
                />
              </div>

              {/* Quick Topic Title Suggestions for Listening */}
              {targetDestination === "listening" && (
                <div className="flex items-center gap-2 text-xs text-muted-label pt-1 pl-1 flex-wrap">
                  <span className="font-medium">Quick 1200 Lexicon Suggestions:</span>
                  {["Studying university/college", "Subjects", "Finance & Banking", "Accommodation"].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setBulkTopic(sug);
                        if (rawText) setPreviewItems(parseDelimitedText(rawText, sug));
                      }}
                      className="px-2 py-0.5 rounded-md bg-plum/5 hover:bg-plum/10 text-plum font-semibold cursor-pointer border border-plum/15 transition"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Textarea for Direct Copy-Paste */}
            <textarea
              rows={7}
              value={rawText}
              onChange={handleTextChange}
              placeholder={`Fastidious\tAdjective\tখুঁতখুঁতে\tMeticulous, Scrupulous\tHe was fastidious in his work.\nUbiquitous\tAdjective\tসর্বব্যাপী\tOmnipresent\tSmartphones are ubiquitous.`}
              className="imlaa-input font-mono text-sm leading-relaxed p-4"
            />

            {/* Actions & Summary Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-base text-body-dark font-medium">
                Detected Rows:{" "}
                <span className="font-bold text-plum">
                  {previewItems.length} valid items ready
                </span>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {rawText && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText("");
                      setPreviewItems([]);
                    }}
                    className="imlaa-btn-secondary py-3 px-5 text-base"
                  >
                    Clear Text
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={importing || previewItems.length === 0}
                  className="imlaa-btn-primary py-3 px-6 text-base space-x-2 flex-1 sm:flex-none"
                >
                  <HiCloudArrowUp className="w-5 h-5" />
                  <span>
                    {importing
                      ? "Importing..."
                      : `Import ${previewItems.length} Words`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Import Result Notification */}
          {importResult && (
            <div className="p-4 rounded-xl border border-emerald-600/30 bg-emerald-50 text-emerald-800 text-base font-medium flex items-center space-x-2 animate-slide-up">
              <HiCheckCircle className="w-6 h-6 shrink-0 text-emerald-600" />
              <span>
                {importResult.message} ({importResult.insertedCount} words
                inserted, {importResult.skippedCount} skipped).
              </span>
            </div>
          )}

          {/* Live Data Preview Table */}
          {previewItems.length > 0 && (
            <div className="imlaa-card p-6 sm:p-8 space-y-4 animate-slide-up">
              <div className="flex items-center justify-between pb-2 border-b border-plum/15">
                <h3 className="text-lg font-bold text-body-dark">
                  Live Parsed Preview ({previewItems.length} Entries)
                </h3>
                <span className="text-sm font-semibold text-plum">
                  Ready for database insertion
                </span>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-plum/20 text-muted-label uppercase text-xs font-bold">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Word</th>
                      <th className="py-2.5 px-3">POS</th>
                      <th className="py-2.5 px-3">Meaning (Bengali)</th>
                      <th className="py-2.5 px-3">Synonyms</th>
                      <th className="py-2.5 px-3">Usage Example</th>
                      <th className="py-2.5 px-3">Topic</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-plum/10">
                    {previewItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-plum/5">
                        <td className="py-2.5 px-3 font-mono font-bold text-muted-label">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-body-dark">
                          {item.word}
                        </td>
                        <td className="py-2.5 px-3 italic text-plum">
                          {item.pos}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-body-dark">
                          {item.banglaMeaning}
                        </td>
                        <td className="py-2.5 px-3 text-muted-label">
                          {item.synonyms?.join(", ") || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-muted-label truncate max-w-xs italic">
                          {item.exampleUsage || "—"}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-plum font-semibold">
                          {item.topic}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODE 2: SINGLE MANUAL ENTRY                          */}
      {/* ==================================================== */}
      {activeTab === "single" && (
        <div className="imlaa-card p-8 sm:p-10">
          <form onSubmit={handleSingleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold text-body-dark mb-2">
                  Target Word *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ineffable"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  className="imlaa-input text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-body-dark mb-2">
                  Part of Speech
                </label>
                <select
                  value={pos}
                  onChange={(e) => setPos(e.target.value)}
                  className="imlaa-input text-base"
                >
                  <option value="Noun">Noun</option>
                  <option value="Verb">Verb</option>
                  <option value="Adjective">Adjective</option>
                  <option value="Adverb">Adverb</option>
                  <option value="Preposition">Preposition</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-body-dark mb-2">
                Bengali Meaning *
              </label>
              <input
                type="text"
                placeholder="e.g. অবর্ণনীয় / যা ভাষায় প্রকাশ করা যায় না"
                value={banglaMeaning}
                onChange={(e) => setBanglaMeaning(e.target.value)}
                className="imlaa-input text-base"
                required
              />
            </div>

            {/* Target Corpus Destination Selector (Admin / Active vs Uploaded) */}
            <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <HiShieldCheck className={`w-5 h-5 ${isAdmin ? "text-plum" : "text-muted-label"}`} />
                <span className="text-base font-bold text-body-dark">
                  Target Corpus Destination:
                </span>
                {isAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-plum/10 text-plum text-xs font-bold">
                    Admin Privileges
                  </span>
                )}
              </div>

              <div className="inline-flex items-center bg-white p-1 rounded-xl border border-plum/20 shadow-xs flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setTargetDestination("active");
                    setTopic("Academic Word List: Sublist A");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    targetDestination === "active"
                      ? "bg-plum text-white shadow-xs font-bold"
                      : "text-muted-label hover:text-body-dark"
                  }`}
                >
                  All Active Tab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetDestination("listening");
                    setTopic("Studying university/college");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    targetDestination === "listening"
                      ? "bg-plum text-white shadow-xs font-bold"
                      : "text-muted-label hover:text-body-dark"
                  }`}
                >
                  Listening Vocabs Tab
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetDestination("uploaded");
                    setTopic("Uploaded Custom Topic");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    targetDestination === "uploaded"
                      ? "bg-plum text-white shadow-xs font-bold"
                      : "text-muted-label hover:text-body-dark"
                  }`}
                >
                  Uploaded Tab
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-semibold text-body-dark mb-2">
                  Synonyms (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Indescribable, Unutterable"
                  value={synonyms}
                  onChange={(e) => setSynonyms(e.target.value)}
                  className="imlaa-input text-base"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-body-dark mb-2">
                  {targetDestination === "active" ? "Active Topic Name:" : "Custom Target Topic Name:"}
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={targetDestination === "active" ? "Academic Word List: Sublist A" : "e.g. My IELTS Vocabulary, Medical Terms..."}
                  className="imlaa-input text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-body-dark mb-2">
                Example Usage
              </label>
              <textarea
                rows={3}
                placeholder="e.g. The grand sight filled him with an ineffable sense of wonder."
                value={exampleUsage}
                onChange={(e) => setExampleUsage(e.target.value)}
                className="imlaa-input text-base resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={importing}
              className="imlaa-btn-primary w-full py-4 text-base space-x-2"
            >
              <HiCloudArrowUp className="w-5 h-5" />
              <span>{importing ? "Uploading..." : "Save to Study List"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
