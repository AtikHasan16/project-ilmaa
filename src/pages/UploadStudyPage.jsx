import { useState, useEffect, useRef, useMemo } from "react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import {
  HiCloudArrowUp,
  HiDocumentArrowUp,
  HiCheckCircle,
  HiShieldCheck,
  HiLockClosed,
  HiQuestionMarkCircle,
  HiExclamationTriangle,
} from "react-icons/hi2";
import { showConfirmModal, showSuccessToast, showErrorAlert } from "../utils/sweetalert";
import { parseDelimitedText } from "../utils/csvParser";
import { escapeHtml } from "../utils/escapeHtml";
import { extractErrorDetails } from "../utils/errorParser";
import UploadGuideModal from "../components/UploadGuideModal";

export default function UploadStudyPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // General users can only upload to "uploaded" tab
  const [targetDestination, setTargetDestination] = useState("uploaded");
  useEffect(() => {
    if (isAdmin) setTargetDestination("active");
  }, [isAdmin]);

  // Bulk upload state
  const [rawText, setRawText] = useState("");
  const [bulkTopic, setBulkTopic] = useState("Academic Word List: Sublist A");
  const [previewItems, setPreviewItems] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const fileInputRef = useRef(null);

  // Pre-validate internal duplicates within user input batch
  const internalBatchDuplicates = useMemo(() => {
    const counts = new Map();
    previewItems.forEach((it) => {
      const normalized = (it.word || "").trim().toLowerCase();
      if (normalized) {
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([word]) => word);
  }, [previewItems]);

  // Apply sample example text from guide modal
  const handleApplyExample = (exampleText) => {
    setRawText(exampleText);
    const parsed = parseDelimitedText(exampleText, bulkTopic);
    setPreviewItems(parsed);
    setImportResult(null);
    setUploadError(null);
    showSuccessToast(
      "Example Loaded",
      `Loaded ${parsed.length} sample words into editor.`,
    );
  };

  // Parse raw text whenever user pastes or edits textarea
  const handleTextChange = (e) => {
    const text = e.target.value;
    setRawText(text);
    const parsed = parseDelimitedText(text, bulkTopic);
    setPreviewItems(parsed);
    setImportResult(null);
    setUploadError(null);
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
        setImportResult(null);
        setUploadError(null);
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

  // Submit the import through the database RPC, which enforces the daily quota.
  const handleBulkSubmit = async () => {
    if (previewItems.length === 0) {
      showErrorAlert(
        "Empty Import",
        "Please paste valid tabular data or upload a CSV file first.",
      );
      return;
    }

    const destLabel =
      targetDestination === "active" ? "All Active Corpus" : "Uploaded Corpus";
    const confirmRes = await showConfirmModal({
      title: "Confirm Bulk Import?",
      text: `Upload ${previewItems.length} vocabulary entries into [${destLabel}] under "${bulkTopic}"?`,
      confirmButtonText: "Start Import",
      icon: "question",
    });

    if (!confirmRes.isConfirmed) return;

    setImporting(true);
    setImportResult(null);
    setUploadError(null);

    try {
      const res = await apiClient.post("/vocabulary/bulk", {
        items: previewItems,
        defaultTopic: bulkTopic,
        targetTab: targetDestination,
      });

      if (res.data?.success) {
        setImportResult(res.data);
        showSuccessToast("Import Complete", res.data.message);
        setRawText("");
        setPreviewItems([]);
        setUploadError(null);
      }
    } catch (err) {
      console.error("Bulk Import Error caught:", err);

      const parsedError = extractErrorDetails(err);
      const {
        code,
        details,
        message,
        hint,
        isDuplicate,
        conflictingWord,
      } = parsedError;
      const conflictingTopic = parsedError.conflictingTopic || bulkTopic;

      setUploadError({
        code,
        details,
        message,
        hint,
        conflictingWord,
        conflictingTopic,
      });

      if (isDuplicate) {
        const swalHtml = `
          <div style="text-align: left; font-size: 0.95rem; line-height: 1.5; color: #374151;">
            <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 12px 14px; border-radius: 10px; margin-bottom: 12px; color: #92400e;">
              <div style="font-weight: 700; font-size: 1rem; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                <span>⚠️</span> Duplicate Vocabulary Conflict
              </div>
              <div>
                ${
                  conflictingWord
                    ? `The word <strong style="color: #6d4e56; font-size: 1.05rem;">"${escapeHtml(conflictingWord)}"</strong>`
                    : "A vocabulary item"
                } already exists under topic <strong style="color: #6d4e56;">"${escapeHtml(conflictingTopic)}"</strong>.
              </div>
            </div>

            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; font-size: 0.82rem; color: #4b5563;">
              <div style="font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.72rem; color: #6b7280; margin-bottom: 6px;">
                Database Conflict Details
              </div>
              ${
                details
                  ? `<div style="margin-bottom: 6px;"><strong style="color: #1f2937;">Details:</strong> <span style="font-family: monospace; color: #6d4e56; font-weight: 600;">${escapeHtml(details)}</span></div>`
                  : ""
              }
              <div style="margin-bottom: 6px;"><strong style="color: #1f2937;">Message:</strong> <span style="font-family: monospace; color: #4b5563;">${escapeHtml(message)}</span></div>
              ${
                code
                  ? `<div><strong style="color: #1f2937;">Error Code:</strong> <span style="font-family: monospace; background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #1f2937;">${escapeHtml(code)}</span></div>`
                  : ""
              }
              ${
                hint
                  ? `<div style="margin-top: 6px;"><strong style="color: #1f2937;">Hint:</strong> <span>${escapeHtml(hint)}</span></div>`
                  : ""
              }
            </div>

            <p style="margin-top: 12px; font-size: 0.8rem; color: #6b7280;">
              💡 <em>To resolve: Remove or edit <strong>"${escapeHtml(conflictingWord || "the duplicate word")}"</strong> in your list, or change the topic category.</em>
            </p>
          </div>
        `;

        showErrorAlert("Duplicate Entry Detected", swalHtml);
      } else {
        const swalHtml = `
          <div style="text-align: left; font-size: 0.95rem; line-height: 1.5; color: #374151;">
            <p style="margin-bottom: 10px; font-weight: 600; color: #1f2937;">${escapeHtml(message)}</p>
            ${
              details
                ? `<div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; font-size: 0.82rem; font-family: monospace; color: #6d4e56; margin-bottom: 8px;"><strong>Details:</strong> ${escapeHtml(details)}</div>`
                : ""
            }
            ${
              hint
                ? `<div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 6px;"><strong>Hint:</strong> ${escapeHtml(hint)}</div>`
                : ""
            }
            ${
              code
                ? `<div style="font-size: 0.75rem; color: #9ca3af; font-family: monospace;">Code: ${escapeHtml(code)}</div>`
                : ""
            }
          </div>
        `;

        showErrorAlert("Bulk Import Error", swalHtml);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div>
          <h2 className="text-3xl font-black text-body-dark tracking-tight">
            Upload to Study
          </h2>
          <p className="text-lg text-muted-label mt-1">
            Bulk import vocabulary from Google Sheets, CSV, or TSV files.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsGuideOpen(true)}
          className="imlaa-btn-secondary py-2.5 px-4 text-sm font-bold flex items-center space-x-2 shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <HiQuestionMarkCircle className="w-5 h-5 text-plum" />
          <span>Upload Guide & Examples</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* BULK IMPORT (TSV & CSV)                              */}
      {/* ==================================================== */}
      <div className="flex flex-col space-y-6">
        {/* Instructions Box */}
        <div className="imlaa-card p-5 border border-plum/20 bg-plum/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h4 className="text-base font-bold text-plum uppercase tracking-wider">
              Expected Column Order (Database Standard)
            </h4>
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="text-xs font-bold text-plum hover:underline cursor-pointer flex items-center space-x-1"
            >
              <span>View full guide & sample data →</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm font-mono text-body-dark">
            <span className="p-2 rounded bg-white border border-plum/15 font-bold">
              1. Word
            </span>
            <span className="p-2 rounded bg-white border border-plum/15 font-bold">
              2. Grammar Type
            </span>
            <span className="p-2 rounded bg-white border border-plum/15 font-bold">
              3. Meaning
            </span>
            <span className="p-2 rounded bg-white border border-plum/15">
              4. Synonyms
            </span>
            <span className="p-2 rounded bg-white border border-plum/15">5. Example</span>
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
                Supports Tab-Separated Values (Google Docs/Sheets) and comma-separated
                CSV.
              </span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="imlaa-btn-secondary py-2 px-3 text-sm space-x-1.5 cursor-pointer"
                title="Open upload guide and sample data"
              >
                <HiQuestionMarkCircle className="w-4 h-4 text-plum" />
                <span>Guide</span>
              </button>

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
                className="imlaa-btn-secondary py-2 px-4 text-base space-x-2 cursor-pointer"
              >
                <HiDocumentArrowUp className="w-5 h-5" />
                <span>Upload .CSV File</span>
              </button>
            </div>
          </div>

          {/* Target Corpus Destination Selector */}
          <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <HiShieldCheck
                  className={`w-5 h-5 ${isAdmin ? "text-plum" : "text-muted-label"}`}
                />
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
                {/* All Active Tab — locked for general users */}
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => {
                    if (!isAdmin) return;
                    setTargetDestination("active");
                    setBulkTopic("Example Topic");
                    if (rawText) {
                      setPreviewItems(parseDelimitedText(rawText, "Example Topic"));
                    }
                  }}
                  title={!isAdmin ? "Admin only" : undefined}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center space-x-1 ${
                    !isAdmin
                      ? "cursor-not-allowed opacity-60 text-muted-label"
                      : targetDestination === "active"
                        ? "cursor-pointer bg-plum text-white shadow-xs font-bold"
                        : "cursor-pointer text-muted-label hover:text-body-dark"
                  }`}
                >
                  {!isAdmin && <HiLockClosed className="w-3.5 h-3.5" />}
                  <span>All Active Tab</span>
                </button>

                {/* Listening Vocabs Tab — locked for general users */}
                <button
                  type="button"
                  disabled={!isAdmin}
                  onClick={() => {
                    if (!isAdmin) return;
                    setTargetDestination("listening");
                    setBulkTopic("Test Topic");
                    if (rawText) {
                      setPreviewItems(parseDelimitedText(rawText, "Test Topic"));
                    }
                  }}
                  title={!isAdmin ? "Admin only" : undefined}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center space-x-1 ${
                    !isAdmin
                      ? "cursor-not-allowed opacity-60 text-muted-label"
                      : targetDestination === "listening"
                        ? "cursor-pointer bg-plum text-white shadow-xs font-bold"
                        : "cursor-pointer text-muted-label hover:text-body-dark"
                  }`}
                >
                  {!isAdmin && <HiLockClosed className="w-3.5 h-3.5" />}
                  <span>Listening Vocabs Tab</span>
                </button>

                {/* Uploaded Tab — always available */}
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

            {/* Note for general users */}
            {!isAdmin && (
              <p className="text-xs text-muted-label">
                General members can only upload to the Uploaded tab (max 200 words/day).
              </p>
            )}
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
                {[
                  "Studying university/college",
                  "Subjects",
                  "Finance & Banking",
                  "Accommodation",
                ].map((sug) => (
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
                    setUploadError(null);
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
                  {importing ? "Importing..." : `Import ${previewItems.length} Words`}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Duplicate / Import Error Alert Box */}
        {uploadError && (
          <div className="p-4 sm:p-5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 space-y-3 animate-slide-up shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2">
                <HiExclamationTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                <h4 className="text-base font-bold text-rose-900">
                  {uploadError.conflictingWord || uploadError.code === "23505"
                    ? "Duplicate Vocabulary Conflict Detected"
                    : "Bulk Import Error"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setUploadError(null)}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            {uploadError.conflictingWord && (
              <div className="p-3 bg-white/90 rounded-lg border border-rose-200 text-sm text-body-dark">
                The word{" "}
                <strong className="text-plum font-mono text-base font-bold">
                  "{uploadError.conflictingWord}"
                </strong>{" "}
                already exists in the database under topic{" "}
                <strong className="text-plum font-semibold">
                  "{uploadError.conflictingTopic}"
                </strong>
                . Please remove or update this term in your input before retrying.
              </div>
            )}

            <div className="text-xs font-mono bg-white/80 p-3 rounded-lg border border-rose-200 space-y-1.5 text-rose-950">
              <div>
                <span className="font-bold text-body-dark">Message:</span>{" "}
                {uploadError.message}
              </div>
              {uploadError.details && (
                <div>
                  <span className="font-bold text-body-dark">Details:</span>{" "}
                  <span className="text-plum font-semibold">{uploadError.details}</span>
                </div>
              )}
              {uploadError.code && (
                <div>
                  <span className="font-bold text-body-dark">Code:</span>{" "}
                  <span className="bg-rose-200/70 px-1.5 py-0.5 rounded font-bold">
                    {uploadError.code}
                  </span>
                </div>
              )}
              {uploadError.hint && (
                <div>
                  <span className="font-bold text-body-dark">Hint:</span>{" "}
                  {uploadError.hint}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notice for duplicate words inside the same batch */}
        {internalBatchDuplicates.length > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-sm flex items-start space-x-2.5 animate-slide-up shadow-xs">
            <HiExclamationTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Batch Duplicate Warning:</span> You have{" "}
              {internalBatchDuplicates.length} repeated word(s) in this batch (
              <span className="font-mono font-bold text-plum">
                {internalBatchDuplicates.slice(0, 5).map((w) => `"${w}"`).join(", ")}
                {internalBatchDuplicates.length > 5 ? "..." : ""}
              </span>
              ). Each word within the same topic must be unique.
            </div>
          </div>
        )}

        {/* Import Result Notification */}
        {importResult && (
          <div className="p-4 rounded-xl border border-emerald-600/30 bg-emerald-50 text-emerald-800 text-base font-medium flex items-center space-x-2 animate-slide-up">
            <HiCheckCircle className="w-6 h-6 shrink-0 text-emerald-600" />
            <span>
              {importResult.message} ({importResult.insertedCount} words inserted,{" "}
              {importResult.skippedCount} skipped).
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
                  {previewItems.map((item, idx) => {
                    const isDbConflict =
                      uploadError?.conflictingWord &&
                      item.word?.trim().toLowerCase() ===
                        uploadError.conflictingWord.trim().toLowerCase();
                    const isBatchDuplicate = internalBatchDuplicates.includes(
                      (item.word || "").trim().toLowerCase(),
                    );

                    return (
                      <tr
                        key={idx}
                        className={
                          isDbConflict
                            ? "bg-rose-100/80 border-2 border-rose-400 font-medium"
                            : isBatchDuplicate
                              ? "bg-amber-50/70 hover:bg-amber-100/60"
                              : "hover:bg-plum/5"
                        }
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-muted-label">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-body-dark">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                            <span>{item.word}</span>
                            {isDbConflict && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-600 text-white font-bold uppercase tracking-wider shadow-xs">
                                Conflicting Item
                              </span>
                            )}
                            {!isDbConflict && isBatchDuplicate && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-white font-bold uppercase tracking-wider shadow-xs">
                                Duplicate in Batch
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 italic text-plum">{item.pos}</td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Upload Format & Copy-Paste Guide Modal */}
      <UploadGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onApplyExample={handleApplyExample}
      />
    </div>
  );
}
