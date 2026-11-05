import { useState } from "react";
import { createPortal } from "react-dom";
import { useModalEffects } from "../hooks/useModalEffects";
import {
  HiXMark,
  HiClipboardDocument,
  HiTableCells,
  HiDocumentArrowUp,
  HiLightBulb,
  HiSparkles,
  HiCheckCircle,
  HiArrowRight,
  HiShieldCheck,
  HiInformationCircle,
} from "react-icons/hi2";

export const SAMPLE_TSV_DATA = `Word\tPart of Speech\tMeaning\tSynonyms\tExample Usage
Fastidious\tAdjective\tখুঁতখুঁতে\tMeticulous, Scrupulous\tHe was fastidious in his preparation for the IELTS exam.
Ubiquitous\tAdjective\tসর্বব্যাপী\tOmnipresent, Pervasive\tSmartphones have become ubiquitous in modern academic life.
Pragmatic\tAdjective\tবাস্তবধর্মী\tPractical, Realistic\tWe need a pragmatic approach to improve lexical resource.
Mitigate\tVerb\tহ্রাস করা\tAlleviate, Lessen, Diminish\tTargeted spelling drills help mitigate common orthographic errors.
Ephemeral\tAdjective\tক্ষণস্থায়ী\tTransient, Fleeting, Brief\tMotivation can be ephemeral, but structured discipline endures.`;

export const SAMPLE_CSV_DATA = `Word,Part of Speech,Meaning,Synonyms,Example Usage
Fastidious,Adjective,খুঁতখুঁতে,"Meticulous, Scrupulous","He was fastidious in his preparation for the IELTS exam."
Ubiquitous,Adjective,সর্বব্যাপী,"Omnipresent, Pervasive","Smartphones have become ubiquitous in modern academic life."
Pragmatic,Adjective,বাস্তবধর্মী,"Practical, Realistic","We need a pragmatic approach to improve lexical resource."
Mitigate,Verb,হ্রাস করা,"Alleviate, Lessen, Diminish","Targeted spelling drills help mitigate common orthographic errors."
Ephemeral,Adjective,ক্ষণস্থায়ী,"Transient, Fleeting, Brief","Motivation can be ephemeral, but structured discipline endures."`;

const SAMPLE_PREVIEW_ROWS = [
  {
    word: "Fastidious",
    pos: "Adjective",
    meaning: "খুঁতখুঁতে",
    synonyms: "Meticulous, Scrupulous",
    example: "He was fastidious in his preparation for the IELTS exam.",
  },
  {
    word: "Ubiquitous",
    pos: "Adjective",
    meaning: "সর্বব্যাপী",
    synonyms: "Omnipresent, Pervasive",
    example: "Smartphones have become ubiquitous in modern academic life.",
  },
  {
    word: "Pragmatic",
    pos: "Adjective",
    meaning: "বাস্তবধর্মী",
    synonyms: "Practical, Realistic",
    example: "We need a pragmatic approach to improve lexical resource.",
  },
  {
    word: "Mitigate",
    pos: "Verb",
    meaning: "হ্রাস করা",
    synonyms: "Alleviate, Lessen, Diminish",
    example: "Targeted spelling drills help mitigate common orthographic errors.",
  },
  {
    word: "Ephemeral",
    pos: "Adjective",
    meaning: "ক্ষণস্থায়ী",
    synonyms: "Transient, Fleeting, Brief",
    example: "Motivation can be ephemeral, but structured discipline endures.",
  },
];

export default function UploadGuideModal({ isOpen, onClose, onApplyExample }) {
  const [activeTab, setActiveTab] = useState("sheets"); // 'sheets' | 'columns' | 'examples'
  const [formatType, setFormatType] = useState("tsv"); // 'tsv' | 'csv'
  const [copied, setCopied] = useState(false);

  useModalEffects(isOpen, onClose, false, true);

  if (!isOpen) return null;

  const handleCopySample = async () => {
    try {
      const textToCopy = formatType === "tsv" ? SAMPLE_TSV_DATA : SAMPLE_CSV_DATA;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is restricted
      const textarea = document.createElement("textarea");
      textarea.value = formatType === "tsv" ? SAMPLE_TSV_DATA : SAMPLE_CSV_DATA;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleInsertExample = () => {
    if (typeof onApplyExample === "function") {
      onApplyExample(SAMPLE_TSV_DATA);
      onClose();
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="imlaa-card w-full max-w-3xl bg-white border border-plum/20 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden rounded-2xl animate-scale-up">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-plum/15 flex items-center justify-between bg-plum/5 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-plum text-white flex items-center justify-center shadow-xs shrink-0">
              <HiTableCells className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="upload-guide-title"
                className="text-lg sm:text-xl font-bold text-body-dark tracking-tight"
              >
                Vocabulary Import Guide
              </h2>
              <p className="text-xs sm:text-sm text-muted-label">
                Format your data from Google Sheets, Excel, or CSV files
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Guide Modal"
            className="w-9 h-9 rounded-lg text-muted-label hover:text-body-dark hover:bg-plum/10 flex items-center justify-center cursor-pointer transition min-h-11 min-w-11"
          >
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-plum/10 flex items-center space-x-2 bg-white shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("sheets")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-11 ${
              activeTab === "sheets"
                ? "bg-plum text-white shadow-xs"
                : "text-muted-label hover:text-body-dark hover:bg-plum/5"
            }`}
          >
            Google Sheets & Excel
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("columns")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-11 ${
              activeTab === "columns"
                ? "bg-plum text-white shadow-xs"
                : "text-muted-label hover:text-body-dark hover:bg-plum/5"
            }`}
          >
            Column Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("examples")}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-11 ${
              activeTab === "examples"
                ? "bg-plum text-white shadow-xs"
                : "text-muted-label hover:text-body-dark hover:bg-plum/5"
            }`}
          >
            Live Examples & Data
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* TAB 1: Google Sheets & Excel Copy-Paste Guide */}
          {activeTab === "sheets" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-xl bg-plum/5 border border-plum/15 text-sm text-plum flex items-start space-x-3">
                <HiLightBulb className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  You don’t even need to export or download a file! You can simply
                  highlight cells directly in <strong>Google Sheets</strong> or{" "}
                  <strong>Microsoft Excel</strong>, copy them, and paste them into the
                  box.
                </p>
              </div>

              {/* 3 Step Workflow */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-body-dark">
                  3-Step Quick Copy & Paste Workflow
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border border-plum/20 bg-white shadow-xs space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-plum/10 text-plum font-black text-sm flex items-center justify-center">
                      1
                    </div>
                    <h4 className="font-bold text-sm text-body-dark">
                      Arrange Your Sheet
                    </h4>
                    <p className="text-xs text-muted-label leading-relaxed">
                      Place words in column 1, part of speech in col 2, and Bengali/native
                      meaning in col 3. Synonyms and examples go in cols 4 and 5.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-plum/20 bg-white shadow-xs space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-plum/10 text-plum font-black text-sm flex items-center justify-center">
                      2
                    </div>
                    <h4 className="font-bold text-sm text-body-dark">
                      Select & Copy (Ctrl+C)
                    </h4>
                    <p className="text-xs text-muted-label leading-relaxed">
                      Highlight the rows you want to import. Press{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-plum/10 text-plum font-mono text-[11px] font-bold">
                        Ctrl+C
                      </kbd>{" "}
                      or{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-plum/10 text-plum font-mono text-[11px] font-bold">
                        Cmd+C
                      </kbd>
                      . Header rows are automatically recognized and skipped.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-plum/20 bg-white shadow-xs space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-plum/10 text-plum font-black text-sm flex items-center justify-center">
                      3
                    </div>
                    <h4 className="font-bold text-sm text-body-dark">
                      Paste & Preview (Ctrl+V)
                    </h4>
                    <p className="text-xs text-muted-label leading-relaxed">
                      Click inside the SpellyCraft input textarea and press{" "}
                      <kbd className="px-1.5 py-0.5 rounded bg-plum/10 text-plum font-mono text-[11px] font-bold">
                        Ctrl+V
                      </kbd>
                      . You will immediately see the live parsed table.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Spreadsheet Representation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-body-dark">
                    How it looks in Google Sheets:
                  </h4>
                  <span className="text-xs text-plum font-semibold">
                    Tab-Delimited Representation
                  </span>
                </div>
                <div className="border border-plum/20 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-plum/10 text-plum uppercase font-bold border-b border-plum/20">
                        <tr>
                          <th className="py-2 px-3 border-r border-plum/15 bg-plum/15"></th>
                          <th className="py-2 px-3 border-r border-plum/15">A (Word)</th>
                          <th className="py-2 px-3 border-r border-plum/15">B (POS)</th>
                          <th className="py-2 px-3 border-r border-plum/15">
                            C (Meaning)
                          </th>
                          <th className="py-2 px-3 border-r border-plum/15">
                            D (Synonyms)
                          </th>
                          <th className="py-2 px-3">E (Example)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-plum/10 text-body-dark bg-white">
                        <tr>
                          <td className="py-2 px-2.5 text-center font-bold text-muted-label bg-plum/5 border-r border-plum/10">
                            1
                          </td>
                          <td className="py-2 px-3 border-r border-plum/10 font-bold">
                            Fastidious
                          </td>
                          <td className="py-2 px-3 border-r border-plum/10 italic text-plum">
                            Adjective
                          </td>
                          <td className="py-2 px-3 border-r border-plum/10 font-sans">
                            খুঁতখুঁতে
                          </td>
                          <td className="py-2 px-3 border-r border-plum/10 text-muted-label">
                            Meticulous, Scrupulous
                          </td>
                          <td className="py-2 px-3 text-muted-label italic truncate max-w-xs font-sans">
                            He was fastidious in his work.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2.5 text-center font-bold text-muted-label bg-plum/5 border-r border-plum/10">
                            2
                          </td>
                          <td className="py-2 px-3 border-r border-plum/10 font-bold">
                            Ubiquitous
                          </td>
                          <td className="py-2 px-3 border-r border-plum/10 italic text-plum">
                            Adjective
                          </td>
                          <td className="py-2 px-3 border-r border-plum/10 font-sans">
                            সর্বব্যাপী
                          </td>
                          <td className="py-2 px-3 border-r border-plum/10 text-muted-label">
                            Omnipresent, Pervasive
                          </td>
                          <td className="py-2 px-3 text-muted-label italic truncate max-w-xs font-sans">
                            Smartphones are ubiquitous.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Quick CSV Alternative Note */}
              <div className="p-4 rounded-xl border border-plum/20 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-plum/10 text-plum flex items-center justify-center shrink-0">
                    <HiDocumentArrowUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-body-dark">
                      Prefer uploading a CSV or TSV file directly?
                    </h5>
                    <p className="text-xs text-muted-label">
                      You can click <strong>Upload .CSV File</strong> on the page to pick
                      any exported file.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("examples")}
                  className="imlaa-btn-secondary px-3 py-1.5 text-xs font-bold space-x-1 shrink-0 self-start sm:self-auto"
                >
                  <span>See Sample Files</span>
                  <HiArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Column Specifications & Rules */}
          {activeTab === "columns" && (
            <div className="space-y-5 animate-fade-in">
              <p className="text-sm text-muted-label">
                SpellyCraft expects tabular columns in a specific order so that phonetic
                synthesis, definition checks, and spelling recall cards function
                accurately.
              </p>

              {/* Column Details Cards */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-plum/20 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-plum text-white font-mono text-xs font-bold">
                        Column 1
                      </span>
                      <span className="font-bold text-sm text-body-dark">
                        Target Word
                      </span>
                      <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wide">
                        Required
                      </span>
                    </div>
                    <p className="text-xs text-muted-label">
                      The English spelling of the vocabulary item. Used for speech
                      synthesis, phonetics, and spelling verification.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-plum bg-plum/5 px-2.5 py-1 rounded-md shrink-0">
                    e.g. "Fastidious"
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-plum/20 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-plum text-white font-mono text-xs font-bold">
                        Column 2
                      </span>
                      <span className="font-bold text-sm text-body-dark">
                        Part of Speech (POS)
                      </span>
                      <span className="text-[11px] font-semibold text-muted-label">
                        Optional (Defaults to Adjective)
                      </span>
                    </div>
                    <p className="text-xs text-muted-label">
                      Grammar classification: Noun, Verb, Adjective, Adverb, Phrase, etc.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-plum bg-plum/5 px-2.5 py-1 rounded-md shrink-0">
                    e.g. "Adjective"
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-plum/20 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-plum text-white font-mono text-xs font-bold">
                        Column 3
                      </span>
                      <span className="font-bold text-sm text-body-dark">
                        Bangla / Native Meaning
                      </span>
                      <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wide">
                        Required
                      </span>
                    </div>
                    <p className="text-xs text-muted-label">
                      The primary definition in Bengali or your preferred native language.
                      Shown on flashcards and prompt hints.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-plum bg-plum/5 px-2.5 py-1 rounded-md shrink-0">
                    e.g. "খুঁতখুঁতে"
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-plum/20 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-plum text-white font-mono text-xs font-bold">
                        Column 4
                      </span>
                      <span className="font-bold text-sm text-body-dark">Synonyms</span>
                      <span className="text-[11px] font-semibold text-muted-label">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-muted-label">
                      Related academic synonyms. Separate multiple words using commas (,),
                      semicolons (;), or pipes (|).
                    </p>
                  </div>
                  <div className="text-xs font-mono text-plum bg-plum/5 px-2.5 py-1 rounded-md shrink-0">
                    e.g. "Meticulous, Scrupulous"
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-plum/20 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-plum text-white font-mono text-xs font-bold">
                        Column 5
                      </span>
                      <span className="font-bold text-sm text-body-dark">
                        Example Usage Sentence
                      </span>
                      <span className="text-[11px] font-semibold text-muted-label">
                        Optional
                      </span>
                    </div>
                    <p className="text-xs text-muted-label">
                      A contextual academic sentence. The target word is tested in context
                      during spelling practice.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-plum bg-plum/5 px-2.5 py-1 rounded-md shrink-0 italic max-w-xs truncate">
                    e.g. "He was fastidious in his work."
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-plum/20 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-plum/60 text-white font-mono text-xs font-bold">
                        Column 6
                      </span>
                      <span className="font-bold text-sm text-body-dark">
                        Topic Name Override
                      </span>
                      <span className="text-[11px] font-semibold text-muted-label">
                        Optional (Defaults to page selector)
                      </span>
                    </div>
                    <p className="text-xs text-muted-label">
                      If provided, overrides the topic category for this specific entry.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-plum bg-plum/5 px-2.5 py-1 rounded-md shrink-0">
                    e.g. "Academic List 1"
                  </div>
                </div>
              </div>

              {/* Guardrails Box */}
              <div className="p-4 rounded-xl border border-plum/15 bg-plum/5 space-y-2 text-xs text-body-dark">
                <div className="flex items-center space-x-2 font-bold text-plum text-sm">
                  <HiShieldCheck className="w-4 h-4" />
                  <span>Important Validation Rules</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-muted-label">
                  <li>
                    Both <strong>Word</strong> (Col 1) and <strong>Meaning</strong> (Col
                    3) are strictly required. Any rows with either field blank are safely
                    skipped.
                  </li>
                  <li>
                    Header rows starting with <code>Word</code> or{" "}
                    <code>Target Word</code> are automatically recognized and ignored.
                  </li>
                  <li>
                    Daily Member Limit: Standard candidates can import up to{" "}
                    <strong>200 words per 24-hour cycle</strong> directly into their
                    personal "Uploaded" collection.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: Interactive Examples & One-Click Copy */}
          {activeTab === "examples" && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-body-dark">
                    Ready-to-Use Sample Dataset
                  </h3>
                  <p className="text-xs text-muted-label">
                    Copy this sample or click "Apply to Editor" to test your upload
                    immediately.
                  </p>
                </div>

                <div className="inline-flex items-center bg-plum/5 p-1 rounded-xl border border-plum/15 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setFormatType("tsv")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      formatType === "tsv"
                        ? "bg-plum text-white shadow-xs"
                        : "text-muted-label hover:text-body-dark"
                    }`}
                  >
                    TSV (Sheets/Excel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormatType("csv")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      formatType === "csv"
                        ? "bg-plum text-white shadow-xs"
                        : "text-muted-label hover:text-body-dark"
                    }`}
                  >
                    CSV (Comma)
                  </button>
                </div>
              </div>

              {/* Visual Table of Sample Rows */}
              <div className="border border-plum/20 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-plum text-white font-bold uppercase border-b border-plum/20">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Word</th>
                        <th className="py-2.5 px-3">POS</th>
                        <th className="py-2.5 px-3">Meaning (any)</th>
                        <th className="py-2.5 px-3">Synonyms</th>
                        <th className="py-2.5 px-3">Usage Example</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-plum/10 bg-white">
                      {SAMPLE_PREVIEW_ROWS.map((row, idx) => (
                        <tr key={idx} className="hover:bg-plum/5">
                          <td className="py-2 px-3 font-mono font-bold text-muted-label">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-bold text-body-dark">
                            {row.word}
                          </td>
                          <td className="py-2 px-3 italic text-plum">{row.pos}</td>
                          <td className="py-2 px-3 font-medium text-body-dark">
                            {row.meaning}
                          </td>
                          <td className="py-2 px-3 text-muted-label">{row.synonyms}</td>
                          <td className="py-2 px-3 text-muted-label italic truncate max-w-xs">
                            {row.example}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw Delimited Text Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-body-dark uppercase tracking-wider">
                    Raw {formatType.toUpperCase()} Code
                  </span>
                  <span className="text-xs text-muted-label">
                    {formatType === "tsv"
                      ? "Tab-separated values"
                      : "Comma-separated values"}
                  </span>
                </div>
                <pre className="p-3.5 rounded-xl bg-body-dark text-white font-mono text-xs overflow-x-auto leading-relaxed border border-plum/30 max-h-40">
                  {formatType === "tsv" ? SAMPLE_TSV_DATA : SAMPLE_CSV_DATA}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopySample}
                  className="imlaa-btn-secondary py-2.5 px-4 text-xs sm:text-sm font-bold space-x-2 w-full sm:w-auto justify-center"
                >
                  {copied ? (
                    <>
                      <HiCheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <HiClipboardDocument className="w-4 h-4" />
                      <span>Copy Sample {formatType.toUpperCase()}</span>
                    </>
                  )}
                </button>

                {typeof onApplyExample === "function" && (
                  <button
                    type="button"
                    onClick={handleInsertExample}
                    className="imlaa-btn-primary py-2.5 px-4 text-xs sm:text-sm font-bold space-x-2 w-full sm:w-auto justify-center"
                  >
                    <HiSparkles className="w-4 h-4 text-amber-300" />
                    <span>Insert Example into Editor</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-plum/15 bg-plum/5 flex items-center justify-between shrink-0">
          <div className="text-xs text-muted-label hidden sm:flex items-center space-x-1.5">
            <HiInformationCircle className="w-4 h-4 text-plum shrink-0" />
            <span>Need more help? Check the format tips above.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="imlaa-btn-primary px-5 py-2 text-sm font-bold ml-auto"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
