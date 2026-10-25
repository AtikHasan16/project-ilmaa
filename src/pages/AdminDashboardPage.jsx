import { useState, useEffect, useCallback } from "react";
import apiClient from "../services/apiClient";
import {
  HiCheck,
  HiXMark,
  HiKey,
  HiUsers,
  HiClock,
  HiArrowPath,
  HiArrowDownTray,
  HiTrash,
  HiSignal,
  HiClipboard,
  HiClipboardDocumentCheck,
} from "react-icons/hi2";
import {
  showConfirmModal,
  showSuccessToast,
  showErrorAlert,
} from "../utils/sweetalert";
import { exportAuditReportPDF } from "../utils/exportReportPdf";

export default function AdminDashboardPage() {
  const [candidateName, setCandidateName] = useState("");
  const [candidateRole, setCandidateRole] = useState("general");
  const [generating, setGenerating] = useState(false);
  const [generatedUser, setGeneratedUser] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopyInstructions = async () => {
    if (!generatedUser) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ilmaa.vercel.app";
    const text = `🎓 Welcome to Imlaa IELTS Workspace!\n\nCandidate Name: ${generatedUser.name}\n10-Digit Access ID: ${generatedUser.accessId}\nRole: ${generatedUser.role}\n\n👉 Login link: ${origin}\n\nNote: Please use your authorized device when logging in.`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showSuccessToast("Copied to Clipboard", "Ready to paste into WhatsApp or Email!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showErrorAlert("Copy Failed", "Please copy the ID manually.");
    }
  };

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  // Audit state
  const [auditStats, setAuditStats] = useState({
    totalRegistered: 0,
    approvedCount: 0,
    activeNowCount: 0,
  });
  const [auditUsers, setAuditUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  // Fetch pending access requests
  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await apiClient.get("/admin/access-requests");
      if (res.data?.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load access requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  // Fetch users audit and activity stats
  const fetchAuditData = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const [usersRes, logsRes] = await Promise.all([
        apiClient.get("/admin/users-audit"),
        apiClient.get("/admin/audit-logs"),
      ]);

      if (usersRes.data?.success) {
        setAuditStats({
          totalRegistered: usersRes.data.totalRegistered,
          approvedCount: usersRes.data.approvedCount,
          activeNowCount: usersRes.data.activeNowCount,
        });
        setAuditUsers(usersRes.data.users || []);
      }

      if (logsRes.data?.success) {
        setAuditLogs(logsRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load audit data:", err);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchAuditData();

    // Auto refresh active user statuses every 45s
    const interval = setInterval(() => {
      fetchAuditData();
    }, 45000);

    return () => clearInterval(interval);
  }, [fetchRequests, fetchAuditData]);

  // Generate 10-digit ID
  const handleGenerateId = async (e) => {
    e.preventDefault();
    if (!candidateName.trim()) return;

    setGenerating(true);
    try {
      const res = await apiClient.post("/admin/access-ids", {
        name: candidateName.trim(),
        role: candidateRole,
      });

      if (res.data?.success) {
        setGeneratedUser(res.data.data);
        setCandidateName("");
        fetchAuditData();
      }
    } catch (err) {
      console.error("Generate ID failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  // Approve pending request
  const handleApprove = async (accessId) => {
    try {
      const res = await apiClient.patch(`/admin/access-requests/${accessId}/approve`, {});
      if (res.data?.success) {
        setActionMessage(`Approved Access ID: ${accessId}`);
        fetchRequests();
        fetchAuditData();
      }
    } catch (err) {
      console.error("Approve failed:", err);
    }
  };

  // Reject pending request
  const handleReject = async (accessId) => {
    try {
      const res = await apiClient.patch(`/admin/access-requests/${accessId}/reject`, {});
      if (res.data?.success) {
        setActionMessage(`Rejected Access ID: ${accessId}`);
        fetchRequests();
        fetchAuditData();
      }
    } catch (err) {
      console.error("Reject failed:", err);
    }
  };

  // Reset user device binding (allows logging in from new machine)
  const handleResetDevice = async (accessId, name) => {
    const res = await showConfirmModal({
      title: "Reset Device Binding?",
      text: `Reset device key for ${name} (${accessId})? They will be prompted to register their current browser on next login.`,
      confirmButtonText: "Yes, Reset Device",
      isDanger: false,
      icon: "question",
    });

    if (!res.isConfirmed) return;

    try {
      const apiRes = await apiClient.patch(`/admin/users/${accessId}/reset-device`);
      if (apiRes.data?.success) {
        showSuccessToast("Device Key Reset", apiRes.data.message);
        fetchAuditData();
      }
    } catch (err) {
      showErrorAlert("Reset Failed", err.response?.data?.message || err.message);
    }
  };

  // Delete single log entry
  const handleDeleteLog = async (logId) => {
    const res = await showConfirmModal({
      title: "Delete Log Entry?",
      text: "Are you sure you want to delete this specific audit log event?",
      confirmButtonText: "Delete Entry",
      isDanger: true,
      icon: "warning",
    });

    if (!res.isConfirmed) return;

    try {
      const apiRes = await apiClient.delete(`/admin/audit-logs/${logId}`);
      if (apiRes.data?.success) {
        setAuditLogs((prev) => prev.filter((l) => l._id !== logId));
        showSuccessToast("Log Entry Removed");
      }
    } catch (err) {
      showErrorAlert("Delete Failed", err.response?.data?.message || err.message);
    }
  };

  // Clear all audit logs
  const handleClearAllLogs = async () => {
    const res = await showConfirmModal({
      title: "Clear Entire Audit Trail?",
      text: "Are you sure you want to permanently erase all security and audit log entries? This action cannot be reversed.",
      confirmButtonText: "Erase All Logs",
      isDanger: true,
      icon: "warning",
    });

    if (!res.isConfirmed) return;

    try {
      const apiRes = await apiClient.delete("/admin/audit-logs");
      if (apiRes.data?.success) {
        setAuditLogs([]);
        showSuccessToast("Audit Trail Cleared");
      }
    } catch (err) {
      showErrorAlert("Clear Failed", err.response?.data?.message || err.message);
    }
  };

  // Trigger PDF export
  const handleExportPDF = () => {
    exportAuditReportPDF({
      users: auditUsers,
      logs: auditLogs,
      stats: auditStats,
    });
  };

  return (
    <div className="w-full flex flex-col space-y-10 animate-slide-up">
      {/* Header with Export & Refresh Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div>
          <h2 className="text-3xl font-black text-body-dark tracking-tight">
            Admin Dashboard
          </h2>
          <p className="text-lg text-muted-label mt-1">
            Generate access IDs, monitor live active sessions, and audit access security logs.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchAuditData}
            title="Refresh Live Metrics"
            className="imlaa-btn-secondary py-2.5 px-4 text-base space-x-2"
          >
            <HiArrowPath className={`w-5 h-5 ${loadingAudit ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="imlaa-btn-primary py-2.5 px-5 text-base space-x-2 shadow-sm"
          >
            <HiArrowDownTray className="w-5 h-5" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-plum/10 text-plum text-base font-semibold border border-plum/20 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage("")}
            className="text-plum hover:text-plum-hover text-sm font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* 1. Live Overview Stats (Active Now & Registration)   */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Metric 1: Currently Active Online */}
        <div className="imlaa-card p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-base uppercase tracking-wider text-muted-label font-bold mb-1">
              Currently Active Online
            </div>
            <div className="text-4xl font-black text-emerald-700 flex items-center space-x-3">
              <span>{auditStats.activeNowCount}</span>
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-base text-muted-label mt-1">
              Active within the last 5 minutes
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HiSignal className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Approved Candidates */}
        <div className="imlaa-card p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-base uppercase tracking-wider text-muted-label font-bold mb-1">
              Approved Candidates
            </div>
            <div className="text-4xl font-black text-plum">
              {auditStats.approvedCount}
            </div>
            <div className="text-base text-muted-label mt-1">
              Authorized device keys issued
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-plum/10 text-plum flex items-center justify-center">
            <HiUsers className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Pending Ingress Queue */}
        <div className="imlaa-card p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-base uppercase tracking-wider text-muted-label font-bold mb-1">
              Pending Queue
            </div>
            <div className="text-4xl font-black text-body-dark">
              {requests.length}
            </div>
            <div className="text-base text-muted-label mt-1">
              Awaiting administrator approval
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <HiClock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. Candidate Creation & Pending Queue Columns        */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Generate Access ID Card */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="imlaa-card p-6 sm:p-8">
            <div className="flex items-center space-x-3 text-plum mb-4">
              <HiKey className="w-6 h-6" />
              <h3 className="text-xl font-bold text-body-dark">
                Issue 10-Digit ID
              </h3>
            </div>

            <form onSubmit={handleGenerateId} className="space-y-5">
              <div>
                <label className="block text-base font-semibold text-body-dark mb-2">
                  Candidate Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="imlaa-input text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-body-dark mb-2">
                  Assigned Role
                </label>
                <select
                  value={candidateRole}
                  onChange={(e) => setCandidateRole(e.target.value)}
                  className="imlaa-input text-base"
                >
                  <option value="general">General (Vocabulary + Grammar)</option>
                  <option value="advance">Advance (+ Upload to Study)</option>
                  <option value="admin">Admin (Full Access)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generating || !candidateName.trim()}
                className="imlaa-btn-primary w-full py-3.5 text-base"
              >
                {generating ? "Generating..." : "Generate 10-Digit Access ID"}
              </button>
            </form>

            {/* Newly Generated ID Card */}
            {generatedUser && (
              <div className="mt-6 p-5 rounded-xl border border-plum/30 bg-plum/5 text-base space-y-3 animate-slide-up">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-plum text-base">New Access ID Created</span>
                  <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-plum/10 text-plum">
                    {generatedUser.role}
                  </span>
                </div>
                <div className="text-body-dark font-medium text-sm">
                  Candidate: <span className="font-bold text-base">{generatedUser.name}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-plum/15 text-2xl font-mono font-black text-plum tracking-widest text-center">
                  {generatedUser.accessId}
                </div>

                {/* Copy ID & Instructions Button */}
                <button
                  type="button"
                  onClick={handleCopyInstructions}
                  className="imlaa-btn-secondary w-full py-2.5 px-3 text-sm flex items-center justify-center space-x-2 font-semibold hover:border-plum"
                >
                  {copied ? (
                    <>
                      <HiClipboardDocumentCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-emerald-700">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <HiClipboard className="w-5 h-5 text-plum" />
                      <span>Copy ID & Instructions (WhatsApp/Email)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pending Device Requests Table */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="imlaa-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3 text-plum">
                <HiUsers className="w-6 h-6" />
                <h3 className="text-xl font-bold text-body-dark">
                  Access Requests Queue
                </h3>
              </div>
              <span className="imlaa-badge text-base">
                {requests.length} Pending
              </span>
            </div>

            {loadingRequests ? (
              <div className="p-8 text-center text-muted-label animate-pulse">
                Refreshing queue...
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-muted-label flex flex-col items-center space-y-2">
                <HiClock className="w-8 h-8 text-plum/30" />
                <div className="text-base">No pending access requests in the queue.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req.accessId}
                    className="p-4 rounded-xl border border-plum/20 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-lg font-bold text-body-dark">
                        {req.name}
                      </div>
                      <div className="font-mono text-base text-plum font-semibold">
                        ID: {req.accessId}
                      </div>
                      <div className="text-base text-muted-label mt-0.5">
                        Role: <span className="capitalize">{req.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApprove(req.accessId)}
                        className="imlaa-btn-primary py-2 px-4 text-base space-x-1"
                      >
                        <HiCheck className="w-5 h-5" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(req.accessId)}
                        className="imlaa-btn-secondary py-2 px-4 text-base text-rose-700 border-rose-300 hover:bg-rose-50 space-x-1"
                      >
                        <HiXMark className="w-5 h-5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. Candidate Access Directory Table (Who has access) */}
      {/* ==================================================== */}
      <div className="imlaa-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-plum/15">
          <div>
            <h3 className="text-xl font-bold text-body-dark">
              Candidate Access Directory
            </h3>
            <p className="text-base text-muted-label mt-0.5">
              Full registry of candidates issued 10-digit IDs and their active online presence.
            </p>
          </div>
          <span className="imlaa-badge text-base">
            {auditUsers.length} Registered Candidates
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-plum/20 text-muted-label uppercase text-sm font-bold">
                <th className="py-3 px-3">Candidate</th>
                <th className="py-3 px-3">10-Digit ID</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Live Presence</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/10">
              {auditUsers.map((user) => (
                <tr key={user.accessId} className="hover:bg-plum/5 transition-colors">
                  <td className="py-3.5 px-3 font-semibold text-body-dark">
                    {user.name}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-plum">
                    {user.accessId}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="capitalize font-medium text-body-dark">
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-sm font-bold uppercase ${
                        user.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : user.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {user.isOnline ? (
                      <span className="inline-flex items-center space-x-2 text-emerald-700 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Active Now</span>
                      </span>
                    ) : (
                      <span className="text-muted-label">
                        {user.lastActiveAt
                          ? `Seen ${new Date(user.lastActiveAt).toLocaleDateString()}`
                          : "Never logged in"}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleResetDevice(user.accessId, user.name)}
                      title="Reset hardware device binding"
                      className="imlaa-btn-secondary py-1 px-3 text-sm cursor-pointer hover:border-plum"
                    >
                      Reset Device
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 4. Audit Log Trail (With Clear / Delete Options)     */}
      {/* ==================================================== */}
      <div className="imlaa-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-plum/15">
          <div>
            <h3 className="text-xl font-bold text-body-dark">
              Security & Access Audit Trail
            </h3>
            <p className="text-base text-muted-label mt-0.5">
              Historical access event logs, approvals, and device binding resets.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="imlaa-badge text-base">
              {auditLogs.length} Events
            </span>
            {auditLogs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllLogs}
                className="imlaa-btn-secondary py-1.5 px-3 text-sm text-rose-700 border-rose-300 hover:bg-rose-50 space-x-1"
              >
                <HiTrash className="w-4 h-4" />
                <span>Clear All Logs</span>
              </button>
            )}
          </div>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-label text-base">
            No audit log records recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead>
                <tr className="border-b border-plum/20 text-muted-label uppercase text-sm font-bold">
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Candidate & ID</th>
                  <th className="py-3 px-3">Event Details</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {auditLogs.map((log) => (
                  <tr key={log._id || log.timestamp} className="hover:bg-plum/5 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-plum text-sm">
                      {log.action}
                    </td>
                    <td className="py-3 px-3 font-semibold text-body-dark">
                      {log.userName} <span className="font-mono text-xs text-muted-label">({log.accessId || "—"})</span>
                    </td>
                    <td className="py-3 px-3 text-body-dark">
                      {log.details}
                    </td>
                    <td className="py-3 px-3 font-mono text-sm text-muted-label whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(log._id)}
                        title="Delete log entry"
                        className="p-1.5 rounded-lg text-muted-label hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
    </div>
  );
}
