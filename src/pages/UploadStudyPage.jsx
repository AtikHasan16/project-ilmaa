import { useState } from "react";
import apiClient from "../services/apiClient";
import { HiCloudArrowUp, HiCheckCircle, HiExclamationCircle } from "react-icons/hi2";

export default function UploadStudyPage() {
  const [word, setWord] = useState("");
  const [pos, setPos] = useState("Adjective");
  const [banglaMeaning, setBanglaMeaning] = useState("");
  const [synonyms, setSynonyms] = useState("");
  const [exampleUsage, setExampleUsage] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!word.trim() || !banglaMeaning.trim()) {
      setErrorMsg("Target word and Bengali meaning are required.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.post("/vocabulary", {
        word: word.trim(),
        pos,
        banglaMeaning: banglaMeaning.trim(),
        synonyms: synonyms
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        exampleUsage: exampleUsage.trim(),
        topic: "Uploaded",
      });

      if (res.data?.success) {
        setSuccessMsg(`"${word.trim()}" added successfully to your Uploaded study list!`);
        setWord("");
        setBanglaMeaning("");
        setSynonyms("");
        setExampleUsage("");
      } else {
        setErrorMsg(res.data?.message || "Failed to upload word.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Upload request error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-6">
      <div>
        <h2 className="text-3xl font-black text-body-dark tracking-tight">
          Upload to Study
        </h2>
        <p className="text-lg text-muted-label mt-1">
          Add custom vocabulary to your personal academic study list.
        </p>
      </div>

      <div className="imlaa-card p-8 sm:p-10">
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-600/30 bg-emerald-50 text-emerald-800 text-base font-medium flex items-center space-x-2">
            <HiCheckCircle className="w-6 h-6 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-rose-600/30 bg-rose-50 text-rose-800 text-base font-medium flex items-center space-x-2">
            <HiExclamationCircle className="w-6 h-6 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div>
            <label className="block text-base font-semibold text-body-dark mb-2">
              Synonyms (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Indescribable, Unutterable, Beyond words"
              value={synonyms}
              onChange={(e) => setSynonyms(e.target.value)}
              className="imlaa-input text-base"
            />
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
            disabled={saving}
            className="imlaa-btn-primary w-full py-4 text-base space-x-2"
          >
            <HiCloudArrowUp className="w-5 h-5" />
            <span>{saving ? "Uploading..." : "Save to Study List"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
