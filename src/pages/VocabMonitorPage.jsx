import { useState, useEffect, useCallback } from "react";
import apiClient from "../services/apiClient";
import { useAuth } from "../context/AuthContext";
import {
  HiFolder,
  HiClipboardDocumentList,
  HiTrash,
  HiArrowPath,
  HiArrowDownTray,
  HiMagnifyingGlass,
  HiBookOpen,
  HiShieldCheck,
  HiClock,
} from "react-icons/hi2";
import {
  showConfirmModal,
  showSuccessToast,
  showErrorAlert,
} from "../utils/sweetalert";

export default function VocabMonitorPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("topics"); // 'topics' | 'words' | 'logs'

  // Data states
  const [stats, setStats] = useState(null);
  const [words, setWords] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopicFilter, setSelectedTopicFilter] = useState("all");

  // Fetch summary stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get("/vocabulary/stats");
      if (res.data?.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch vocab stats:", err);
    }
  }, []);

  // Fetch words list
  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedTopicFilter !== "all") {
        params.topic = selectedTopicFilter;
      }
      const res = await apiClient.get("/vocabulary", { params });
      if (res.data?.success) {
        setWords(res.data.data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch words:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTopicFilter]);

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await apiClient.get("/vocabulary/audit-logs");
      if (res.data?.success) {
        setAuditLogs(res.data.data || []);
      }
    } catch (err) {
      console.warn("Failed to fetch audit logs:", err);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchAuditLogs();
  }, [fetchStats, fetchAuditLogs]);

  useEffect(() => {
    if (activeTab === "words") {
      fetchWords();
    }
  }, [activeTab, fetchWords]);

  // Delete entire topic card
  const handleDeleteTopic = async (topicName, count) => {
    const res = await showConfirmModal({
      title: `Delete "${topicName}"?`,
      text: `This will permanently delete the entire topic card and all ${count} vocabulary words contained in it from the database.`,
      confirmButtonText: "Yes, Delete Topic",
      cancelButtonText: "Cancel",
      isDanger: true,
      icon: "warning",
    });

    if (!res.isConfirmed) return;

    try {
      const delRes = await apiClient.delete("/vocabulary/topic", {
        data: { topic: topicName, deletedBy: user?.name || "admin" },
      });
      if (delRes.data?.success) {
        showSuccessToast("Topic Deleted", delRes.data.message);
        fetchStats();
        fetchAuditLogs();
        if (activeTab === "words") fetchWords();
      }
    } catch (err) {
      showErrorAlert("Delete Failed", err.response?.data?.message || err.message);
    }
  };

  // Delete single word entry
  const handleDeleteWord = async (wordObj) => {
    const res = await showConfirmModal({
      title: `Delete "${wordObj.word}"?`,
      text: `Are you sure you want to delete this word from topic "${wordObj.topic}"?`,
      confirmButtonText: "Delete Word",
      isDanger: true,
      icon: "warning",
    });

    if (!res.isConfirmed) return;

    try {
      const delRes = await apiClient.delete(`/vocabulary/${wordObj._id || wordObj.id}`);
      if (delRes.data?.success) {
        setWords((prev) => prev.filter((w) => (w._id || w.id) !== (wordObj._id || wordObj.id)));
        showSuccessToast("Word Removed");
        fetchStats();
        fetchAuditLogs();
      }
    } catch (err) {
      showErrorAlert("Delete Failed", err.response?.data?.message || err.message);
    }
  };

  // Compile all topic lists from stats
  const allActiveTopics = stats?.activeTopics || [];
  const allListeningTopics = stats?.listeningTopics || [];
  const allUploadedTopics = stats?.uploadedTopics || [];

  const combinedTopics = [
    ...allActiveTopics.map((t) => ({ ...t, tab: "All Active" })),
    ...allListeningTopics.map((t) => ({ ...t, tab: "Listening Vocabs" })),
    ...allUploadedTopics.map((t) => ({ ...t, tab: "Uploaded" })),
  ];

  // Filtered words for search
  const filteredWords = words.filter((w) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      w.word?.toLowerCase().includes(term) ||
      w.banglaMeaning?.toLowerCase().includes(term) ||
      w.topic?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="w-full flex flex-col space-y-8 animate-slide-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-black text-body-dark tracking-tight">
              Vocabulary Monitor & Audit
            </h2>
            <span className="imlaa-badge text-base py-1 px-3">
              {stats?.totalCount || 0} Total Words
            </span>
          </div>
          <p className="text-lg text-muted-label mt-1">
            Manage added vocabulary cards, browse terms by topic, and inspect upload reports.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              fetchStats();
              fetchAuditLogs();
              if (activeTab === "words") fetchWords();
            }}
            className="imlaa-btn-secondary py-2.5 px-4 text-base space-x-2"
          >
            <HiArrowPath className="w-5 h-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="imlaa-card p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-wider text-muted-label font-bold mb-1">
              All Active Corpus
            </div>
            <div className="text-3xl font-black text-plum">
              {allActiveTopics.reduce((acc, t) => acc + (t.count || 0), 0)} Lexemes
            </div>
            <div className="text-sm text-muted-label mt-1">
              {allActiveTopics.length} Curriculum Topics
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-plum/10 text-plum flex items-center justify-center">
            <HiBookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="imlaa-card p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-wider text-muted-label font-bold mb-1">
              Listening Vocabs
            </div>
            <div className="text-3xl font-black text-body-dark">
              {allListeningTopics.reduce((acc, t) => acc + (t.count || 0), 0)} Lexemes
            </div>
            <div className="text-sm text-muted-label mt-1">
              {allListeningTopics.length} Listening Topics
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-plum/5 text-plum flex items-center justify-center">
            <HiFolder className="w-6 h-6" />
          </div>
        </div>

        <div className="imlaa-card p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-wider text-muted-label font-bold mb-1">
              Uploaded Corpus
            </div>
            <div className="text-3xl font-black text-emerald-700">
              {stats?.uploadedCount || 0} Lexemes
            </div>
            <div className="text-sm text-muted-label mt-1">
              {allUploadedTopics.length} Custom Topics
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HiClipboardDocumentList className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center space-x-2 bg-plum/5 p-1 rounded-xl border border-plum/20 self-start">
        <button
          type="button"
          onClick={() => setActiveTab("topics")}
          className={`px-4 py-2 rounded-lg text-base font-semibold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === "topics"
              ? "bg-plum text-white shadow-xs"
              : "text-muted-label hover:text-body-dark"
          }`}
        >
          <HiFolder className="w-5 h-5" />
          <span>Topic Cards ({combinedTopics.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("words")}
          className={`px-4 py-2 rounded-lg text-base font-semibold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === "words"
              ? "bg-plum text-white shadow-xs"
              : "text-muted-label hover:text-body-dark"
          }`}
        >
          <HiBookOpen className="w-5 h-5" />
          <span>Browse Words</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-lg text-base font-semibold transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === "logs"
              ? "bg-plum text-white shadow-xs"
              : "text-muted-label hover:text-body-dark"
          }`}
        >
          <HiClock className="w-5 h-5" />
          <span>Upload Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: TOPIC CARDS MANAGEMENT & DELETION            */}
      {/* ==================================================== */}
      {activeTab === "topics" && (
        <div className="imlaa-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-plum/15">
            <div>
              <h3 className="text-xl font-bold text-body-dark">
                Topic Cards & Group Corpus
              </h3>
              <p className="text-base text-muted-label mt-0.5">
                Delete unwanted topics or inspect word distribution across all tabs.
              </p>
            </div>
            <span className="imlaa-badge text-base">
              {combinedTopics.length} Total Groups
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="border-b border-plum/20 text-muted-label uppercase text-sm font-bold">
                  <th className="py-3 px-3">Topic Title</th>
                  <th className="py-3 px-3">Destination Tab</th>
                  <th className="py-3 px-3">Word Count</th>
                  <th className="py-3 px-3 text-right">Delete Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {combinedTopics.map((topic, idx) => (
                  <tr key={idx} className="hover:bg-plum/5 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-body-dark">
                      {topic.title}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-plum/10 text-plum border border-plum/15">
                        {topic.tab}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-body-dark">
                      {topic.count} Lexemes
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {topic.title !== "Academic Word List: Sublist A" ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteTopic(topic.title, topic.count)}
                          className="imlaa-btn-secondary py-1.5 px-3 text-sm text-rose-700 border-rose-300 hover:bg-rose-50 space-x-1.5 cursor-pointer"
                          title="Delete entire topic card"
                        >
                          <HiTrash className="w-4 h-4" />
                          <span>Delete Topic</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted-label italic">Protected Standard</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: BROWSE & DELETE INDIVIDUAL WORDS             */}
      {/* ==================================================== */}
      {activeTab === "words" && (
        <div className="imlaa-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-plum/15">
            <div>
              <h3 className="text-xl font-bold text-body-dark">
                Search & Inspect Words
              </h3>
              <p className="text-base text-muted-label mt-0.5">
                Filter by topic, search spelling, or remove erroneous entries.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Topic Filter Dropdown */}
              <select
                value={selectedTopicFilter}
                onChange={(e) => setSelectedTopicFilter(e.target.value)}
                className="imlaa-input text-base py-2 px-3"
              >
                <option value="all">All Topics</option>
                {combinedTopics.map((t, i) => (
                  <option key={i} value={t.title}>
                    {t.title} ({t.count})
                  </option>
                ))}
              </select>

              {/* Search Box */}
              <div className="relative">
                <HiMagnifyingGlass className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-label" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search word or meaning..."
                  className="imlaa-input text-base pl-10 py-2 pr-3"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-plum font-semibold animate-pulse">
              Loading vocabulary list...
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="p-8 text-center text-muted-label text-base">
              No matching vocabulary words found.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-base">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-plum/20 text-muted-label uppercase text-sm font-bold">
                    <th className="py-3 px-3">Word</th>
                    <th className="py-3 px-3">POS</th>
                    <th className="py-3 px-3">Bengali Meaning</th>
                    <th className="py-3 px-3">Topic</th>
                    <th className="py-3 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-plum/10">
                  {filteredWords.map((w, idx) => (
                    <tr key={w._id || w.id || idx} className="hover:bg-plum/5 transition-colors">
                      <td className="py-3 px-3 font-bold text-body-dark">
                        {w.word}
                      </td>
                      <td className="py-3 px-3 italic text-plum text-sm">
                        {w.pos}
                      </td>
                      <td className="py-3 px-3 text-body-dark">
                        {w.banglaMeaning}
                      </td>
                      <td className="py-3 px-3 font-mono text-sm text-muted-label">
                        {w.topic}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteWord(w)}
                          title="Delete word"
                          className="p-1.5 text-muted-label hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: UPLOAD AUDIT REPORT LOGS                     */}
      {/* ==================================================== */}
      {activeTab === "logs" && (
        <div className="imlaa-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-plum/15">
            <div>
              <h3 className="text-xl font-bold text-body-dark">
                Upload & Topic Mutation Audit Trail
              </h3>
              <p className="text-base text-muted-label mt-0.5">
                Timestamped records of all single uploads, bulk sheet imports, and card deletions.
              </p>
            </div>
            <span className="imlaa-badge text-base">
              {auditLogs.length} Events Logged
            </span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-label text-base">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-base">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-plum/20 text-muted-label uppercase text-sm font-bold">
                    <th className="py-3 px-3">Event Action</th>
                    <th className="py-3 px-3">Uploaded/Deleted By</th>
                    <th className="py-3 px-3">Details</th>
                    <th className="py-3 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-plum/10">
                  {auditLogs.map((log, idx) => (
                    <tr key={log._id || idx} className="hover:bg-plum/5 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-plum text-sm">
                        {log.action}
                      </td>
                      <td className="py-3 px-3 font-semibold text-body-dark">
                        {log.userName || "admin"}
                      </td>
                      <td className="py-3 px-3 text-body-dark text-sm leading-relaxed">
                        {log.details}
                      </td>
                      <td className="py-3 px-3 font-mono text-sm text-muted-label whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
