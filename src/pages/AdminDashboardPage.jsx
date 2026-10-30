import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import apiClient, { supabase } from "../services/apiClient";
import {
  HiUsers,
  HiArrowPath,
  HiArrowDownTray,
  HiTrash,
  HiSignal,
  HiSparkles,
  HiShieldCheck,
  HiMagnifyingGlass,
  HiInformationCircle,
  HiXMark,
} from "react-icons/hi2";
import {
  showConfirmModal,
  showSuccessToast,
  showErrorAlert,
} from "../utils/sweetalert";
import { exportAuditReportPDF } from "../utils/exportReportPdf";

export default function AdminDashboardPage() {
  // Audit state
  const [auditStats, setAuditStats] = useState({
    totalRegistered: 0,
    approvedCount: 0,
    activeNowCount: 0,
  });
  const [auditUsers, setAuditUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  // Candidate filtering & permission explainer states
  const [roleFilter, setRoleFilter] = useState("all"); // 'all' | 'general' | 'advance' | 'admin'
  const [searchQuery, setSearchQuery] = useState("");
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  // Selected candidate profile inspection modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserMetrics, setSelectedUserMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Lock body scroll and listen for ESC key when inspector modal is open
  useEffect(() => {
    if (!selectedUser) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedUser(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedUser]);

  const handleOpenUserDetail = async (u) => {
    setSelectedUser(u);
    setLoadingMetrics(true);
    try {
      const res = await apiClient.get("/user/profile-metrics", {
        params: { accessId: u.id || u.accessId },
      });
      if (res.data?.success) {
        setSelectedUserMetrics(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to fetch user metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }
  };

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
    fetchAuditData();

    // Auto refresh active user statuses every 45s
    const interval = setInterval(() => {
      fetchAuditData();
    }, 45000);

    return () => clearInterval(interval);
  }, [fetchAuditData]);

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

  // Change user role (General / Advance / Admin) with audit tracking
  const handleUpdateRole = async (userId, userName, newRole) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      // Log into audit trail
      try {
        await supabase.from("audit_logs").insert({
          action: "ROLE_CHANGE",
          user_name: userName || "Candidate",
          access_id: userId,
          details: `Role updated to [${newRole.toUpperCase()}] by administrator`,
          timestamp: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn("Could not insert audit log:", logErr);
      }

      showSuccessToast(
        "Permissions Updated",
        `${userName || "Candidate"} has been granted [${newRole.toUpperCase()}] access.`
      );

      if (selectedUser && (selectedUser.id === userId || selectedUser.accessId === userId)) {
        setSelectedUser((prev) => ({ ...prev, role: newRole }));
      }

      fetchAuditData();
    } catch (err) {
      showErrorAlert("Update Failed", err.message || "Failed to update role");
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

  const formatDate = (isoStr) => {
    if (!isoStr) return "Never";
    try {
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return "Never";
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Never";
    }
  };

  // Role counters & filtered candidates
  const generalCount = auditUsers.filter((u) => (u.role || "general") === "general").length;
  const advanceCount = auditUsers.filter((u) => u.role === "advance").length;
  const adminCount = auditUsers.filter((u) => u.role === "admin").length;

  const filteredUsers = auditUsers.filter((u) => {
    const r = u.role || "general";
    const matchesRole = roleFilter === "all" || r === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q) ||
      u.accessId?.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col space-y-8 animate-slide-up pb-12">
      {/* Header with Export & Refresh Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div>
          <h2 className="text-3xl font-black text-body-dark tracking-tight">
            Admin Dashboard
          </h2>
          <p className="text-lg text-muted-label mt-1">
            Manage candidate access permissions, monitor live sessions, and audit security events.
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

      {/* ==================================================== */}
      {/* 1. Live Overview Stats (Strict Platform Plum Family) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Metric 1: Currently Active Online */}
        <div className="imlaa-card p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-base uppercase tracking-wider text-muted-label font-bold mb-1">
              Currently Active Online
            </div>
            <div className="text-4xl font-black text-body-dark font-mono flex items-center space-x-3">
              <span>{auditStats.activeNowCount}</span>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-base text-muted-label mt-1">
              Candidates in active session
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-plum/10 text-plum flex items-center justify-center">
            <HiSignal className="w-7 h-7" />
          </div>
        </div>

        {/* Metric 2: Advance & Admin Members */}
        <div className="imlaa-card p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-base uppercase tracking-wider text-muted-label font-bold mb-1">
              Advance & Admin Tiers
            </div>
            <div className="text-4xl font-black text-plum font-mono">
              {advanceCount + adminCount}
            </div>
            <div className="text-base text-muted-label mt-1">
              {advanceCount} Advance, {adminCount} Admins
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-plum/10 text-plum flex items-center justify-center">
            <HiSparkles className="w-7 h-7" />
          </div>
        </div>

        {/* Metric 3: Total Registered Candidates */}
        <div className="imlaa-card p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-base uppercase tracking-wider text-muted-label font-bold mb-1">
              Total Candidates
            </div>
            <div className="text-4xl font-black text-body-dark font-mono">
              {auditStats.totalRegistered}
            </div>
            <div className="text-base text-muted-label mt-1">
              {generalCount} Free members in registry
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-plum/10 text-plum flex items-center justify-center">
            <HiUsers className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. Candidate Access Directory (Simplified & Unified) */}
      {/* ==================================================== */}
      <div className="imlaa-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-plum/15">
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-xl font-bold text-body-dark">
                Candidate Access Directory
              </h3>
              <button
                type="button"
                onClick={() => setShowPermissionGuide(!showPermissionGuide)}
                className="inline-flex items-center space-x-1 text-xs font-bold text-plum hover:underline cursor-pointer"
              >
                <HiInformationCircle className="w-4 h-4" />
                <span>{showPermissionGuide ? "Hide Tier Guide" : "View Tier Guide"}</span>
              </button>
            </div>
            <p className="text-base text-muted-label mt-0.5">
              Full directory of registered users with role assignments and privilege controls.
            </p>
          </div>

          <span className="imlaa-badge text-base">
            {filteredUsers.length} / {auditUsers.length} Candidates
          </span>
        </div>

        {/* Collapsible Permission Tiers Guide (Harmonious Plum Palette) */}
        {showPermissionGuide && (
          <div className="p-5 rounded-2xl border border-plum/20 bg-plum/5 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-plum uppercase tracking-wider flex items-center space-x-1.5">
                <HiShieldCheck className="w-5 h-5 text-plum" />
                <span>Platform Permission Matrix & Feature Tiers</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPermissionGuide(false)}
                className="text-xs text-muted-label hover:text-body-dark font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Tier 1: General Free */}
              <div className="p-4 rounded-xl bg-white border border-plum/15 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-plum uppercase text-xs">General Member</span>
                  <span className="imlaa-badge text-[11px] py-0.5 px-2">Free</span>
                </div>
                <ul className="text-muted-label space-y-1.5 list-disc list-inside">
                  <li>Full Flashcards & Spelling drills</li>
                  <li>Standard Grammar interactive quizzes</li>
                  <li>Personal learning metrics & progress tracking</li>
                  <li>Standard visitor rate limit queues</li>
                </ul>
              </div>

              {/* Tier 2: Advance Premium */}
              <div className="p-4 rounded-xl bg-plum/5 border border-plum/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-plum uppercase text-xs flex items-center space-x-1">
                    <HiSparkles className="w-3.5 h-3.5 text-plum" />
                    <span>Advance Member</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-plum text-white text-[11px] font-bold">Premium</span>
                </div>
                <ul className="text-muted-label space-y-1.5 list-disc list-inside">
                  <li><strong>Custom Vocabulary Uploads</strong> authorized</li>
                  <li>Native language translations (Bangla, etc.)</li>
                  <li>High-volume & untimed drills (10, 20, 50 questions)</li>
                  <li>Priority audio synthesis queue & server bandwidth</li>
                </ul>
              </div>

              {/* Tier 3: Admin Superuser */}
              <div className="p-4 rounded-xl bg-plum/10 border border-plum/35 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-plum uppercase text-xs">Platform Admin</span>
                  <span className="px-2 py-0.5 rounded-full bg-plum text-white text-[11px] font-bold">Authority</span>
                </div>
                <ul className="text-muted-label space-y-1.5 list-disc list-inside">
                  <li>Promote / demote candidate tiers directly</li>
                  <li>Device binding reset & browser telemetry inspection</li>
                  <li>Full security audit log inspection & purge</li>
                  <li>Export candidate analytics reports to PDF</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls Bar (Search + Role Pills - Strict Plum Palette) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                roleFilter === "all"
                  ? "bg-plum text-white shadow-xs"
                  : "bg-plum/5 text-muted-label hover:bg-plum/10 hover:text-plum border border-plum/15"
              }`}
            >
              All ({auditUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("general")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                roleFilter === "general"
                  ? "bg-plum text-white shadow-xs"
                  : "bg-plum/5 text-muted-label hover:bg-plum/10 hover:text-plum border border-plum/15"
              }`}
            >
              General ({generalCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("advance")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                roleFilter === "advance"
                  ? "bg-plum text-white shadow-xs"
                  : "bg-plum/5 text-muted-label hover:bg-plum/10 hover:text-plum border border-plum/15"
              }`}
            >
              <HiSparkles className="w-3.5 h-3.5" />
              <span>Advance ({advanceCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("admin")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                roleFilter === "admin"
                  ? "bg-plum text-white shadow-xs"
                  : "bg-plum/5 text-muted-label hover:bg-plum/10 hover:text-plum border border-plum/15"
              }`}
            >
              Admin ({adminCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="imlaa-input py-2 pl-9 pr-3 text-xs w-full bg-white"
            />
            <HiMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-label" />
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-plum/20 text-muted-label uppercase text-sm font-bold">
                <th className="py-3 px-3">User / Candidate</th>
                <th className="py-3 px-3">Email & Auth</th>
                <th className="py-3 px-3">Assigned Role</th>
                <th className="py-3 px-3">Live Presence</th>
                <th className="py-3 px-3 text-right">Role Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-plum/10">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-label text-sm">
                    No candidates matched the current role filter or search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id || u.accessId}
                    className="hover:bg-plum/5 transition-colors cursor-pointer"
                    onClick={() => handleOpenUserDetail(u)}
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-10 h-10 rounded-full border border-plum object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-plum/15 text-plum font-bold flex items-center justify-center shrink-0 text-sm">
                            {(u.name || u.email || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-body-dark hover:text-plum flex items-center space-x-1.5">
                            <span>{u.name || "Candidate"}</span>
                            <span className="text-[10px] text-plum bg-plum/10 px-1.5 py-0.2 rounded font-semibold">
                              Inspect
                            </span>
                          </div>
                          <div className="text-xs text-muted-label font-mono">
                            ID: {u.id?.slice(0, 8) || u.accessId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-sm font-medium text-body-dark">{u.email || "—"}</div>
                      <div className="text-xs text-muted-label uppercase font-mono">
                        Via {u.authProvider || "email"}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          u.role === "admin"
                            ? "bg-plum text-white"
                            : u.role === "advance"
                            ? "bg-plum/15 text-plum border border-plum/30"
                            : "bg-plum/5 text-muted-label border border-plum/15"
                        }`}
                      >
                        {u.role === "advance" && <HiSparkles className="w-3 h-3 text-plum" />}
                        <span>{u.role || "general"}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      {u.isOnline ? (
                        <span className="inline-flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Active Now</span>
                        </span>
                      ) : (
                        <span className="text-muted-label text-sm">
                          {u.lastActiveAt
                            ? `Seen ${new Date(u.lastActiveAt).toLocaleDateString()}`
                            : "Never logged in"}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <select
                          value={u.role || "general"}
                          onChange={(e) => handleUpdateRole(u.id, u.name, e.target.value)}
                          className="imlaa-input text-xs py-1.5 px-3 bg-white font-semibold border-plum/25 text-body-dark hover:border-plum focus:border-plum cursor-pointer rounded-xl max-w-37.5"
                        >
                          <option value="general">General (Free)</option>
                          <option value="advance">Advance (Premium)</option>
                          <option value="admin">Platform Admin</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. Audit Log Trail (With Clear / Delete Options)     */}
      {/* ==================================================== */}
      <div className="imlaa-card p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-plum/15">
          <div>
            <h3 className="text-xl font-bold text-body-dark">
              Security & Access Audit Trail
            </h3>
            <p className="text-base text-muted-label mt-0.5">
              Historical access event logs, role promotions, and security events.
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

      {/* ==================================================== */}
      {/* 4. USER PROFILE INSPECTOR MODAL (Portaled to Body)   */}
      {/* ==================================================== */}
      {selectedUser &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedUser(null);
            }}
          >
            <div
              className="imlaa-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white border border-plum/20 shadow-2xl space-y-6 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Avatar & Online Status */}
              <div className="flex items-start justify-between pb-4 border-b border-plum/15">
                <div className="flex items-center space-x-4">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.name}
                      className="w-16 h-16 rounded-2xl border-2 border-plum object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-plum/15 text-plum font-bold flex items-center justify-center text-2xl border-2 border-plum/30">
                      {(selectedUser.name || selectedUser.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-black text-body-dark">
                        {selectedUser.name || "Candidate"}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          selectedUser.role === "admin"
                            ? "bg-plum text-white"
                            : selectedUser.role === "advance"
                            ? "bg-plum/15 text-plum border border-plum/30"
                            : "bg-plum/10 text-plum border border-plum/15"
                        }`}
                      >
                        {selectedUser.role || "general"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-label mt-0.5">
                      {selectedUser.email || "No email linked"} • Auth via {selectedUser.authProvider || "email"}
                    </div>
                    <div className="flex items-center space-x-3 mt-1 text-xs">
                      {selectedUser.isOnline ? (
                        <span className="inline-flex items-center space-x-1.5 text-emerald-700 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Active Online Now</span>
                        </span>
                      ) : (
                        <span className="text-muted-label">
                          Last Active: {selectedUser.lastActiveAt ? new Date(selectedUser.lastActiveAt).toLocaleString() : "Never"}
                        </span>
                      )}

                      <span className="text-muted-label font-mono">
                        Member Since: {formatDate(selectedUser.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-muted-label hover:text-body-dark text-xl font-bold p-2 cursor-pointer"
                >
                  <HiXMark className="w-6 h-6" />
                </button>
              </div>

              {/* Role & Permission Privileges Box (Unified Plum Family) */}
              <div className="p-4 rounded-xl border border-plum/20 bg-plum/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-plum flex items-center space-x-1">
                    <HiShieldCheck className="w-4 h-4 text-plum" />
                    <span>Assigned Access Tier & Capabilities</span>
                  </span>
                  <span className="text-xs font-bold font-mono text-muted-label">
                    ID: {selectedUser.id?.slice(0, 8) || selectedUser.accessId}
                  </span>
                </div>

                <div className="text-xs text-muted-label leading-relaxed">
                  {(selectedUser.role || "general") === "general" && (
                    <p>
                      <strong className="text-body-dark">General Free Tier:</strong> Candidate has access to Core Vocabulary Flashcards, Spelling Drills, and standard Grammar tests.
                    </p>
                  )}
                  {selectedUser.role === "advance" && (
                    <p className="text-body-dark font-medium">
                      <strong className="text-plum">Advance Premium Tier:</strong> Candidate is authorized for custom vocabulary uploads, native language translations, untimed/high-volume quizzes, and priority voice synthesis.
                    </p>
                  )}
                  {selectedUser.role === "admin" && (
                    <p className="text-body-dark font-medium">
                      <strong className="text-plum">Platform Administrator:</strong> Full platform authority to manage candidate credentials, review audit trails, and alter system parameters.
                    </p>
                  )}
                </div>

                {/* 1-Click Role Change Action Buttons (Platform Color Palette) */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-body-dark mr-1">Quick Permissions:</span>

                  <button
                    type="button"
                    onClick={() => handleUpdateRole(selectedUser.id, selectedUser.name, "general")}
                    disabled={(selectedUser.role || "general") === "general"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      (selectedUser.role || "general") === "general"
                        ? "bg-plum/15 text-plum border border-plum/30 cursor-default"
                        : "bg-white hover:bg-plum/10 text-body-dark border border-plum/20 cursor-pointer"
                    }`}
                  >
                    ↩ Set as General
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateRole(selectedUser.id, selectedUser.name, "advance")}
                    disabled={selectedUser.role === "advance"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      selectedUser.role === "advance"
                        ? "bg-plum text-white font-bold shadow-xs cursor-default"
                        : "bg-plum/5 hover:bg-plum/15 text-plum font-bold border border-plum/25 cursor-pointer"
                    }`}
                  >
                    <HiSparkles className="w-3.5 h-3.5" />
                    <span>Grant Advance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateRole(selectedUser.id, selectedUser.name, "admin")}
                    disabled={selectedUser.role === "admin"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedUser.role === "admin"
                        ? "bg-plum text-white font-bold shadow-xs cursor-default"
                        : "bg-plum/5 hover:bg-plum/15 text-plum font-bold border border-plum/25 cursor-pointer"
                    }`}
                  >
                    Promote to Admin
                  </button>
                </div>
              </div>

              {/* Device & Browser Telemetry */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-label">
                  Device & Browser Telemetry
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-plum/5 border border-plum/10">
                    <div className="text-xs text-muted-label">Browser</div>
                    <div className="font-bold text-body-dark mt-0.5">
                      {selectedUser.deviceInfo?.browser || "Web Browser"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-plum/5 border border-plum/10">
                    <div className="text-xs text-muted-label">Operating System</div>
                    <div className="font-bold text-body-dark mt-0.5">
                      {selectedUser.deviceInfo?.os || "Desktop OS"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-plum/5 border border-plum/10">
                    <div className="text-xs text-muted-label">Platform Form</div>
                    <div className="font-bold text-body-dark mt-0.5">
                      {selectedUser.deviceInfo?.platform || "Desktop Workstation"}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-plum/5 border border-plum/10">
                    <div className="text-xs text-muted-label">Display Specs</div>
                    <div className="font-bold text-body-dark mt-0.5 text-xs">
                      {selectedUser.deviceInfo?.screenResolution || "1920 × 1080"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Study Time & Activity Usage */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-label">
                  Usage & Academic Engagement
                </h4>
                {loadingMetrics ? (
                  <div className="p-6 text-center text-sm text-plum animate-pulse">
                    Loading study telemetry...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-plum/20">
                      <div className="text-xs text-muted-label">Time Spent Today</div>
                      <div className="text-xl font-black text-plum mt-0.5">
                        {Math.round(((selectedUserMetrics?.totalStudySeconds || 0) % 3600) / 60)} mins
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-plum/20">
                      <div className="text-xs text-muted-label">Total Month Usage</div>
                      <div className="text-xl font-black text-plum mt-0.5">
                        {Math.max(1, Math.round((selectedUserMetrics?.totalStudySeconds || 0) / 60))} mins
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-plum/20">
                      <div className="text-xs text-muted-label">Words Mastered</div>
                      <div className="text-xl font-black text-plum mt-0.5">
                        {selectedUserMetrics?.masteredCount || 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white border border-plum/20">
                      <div className="text-xs text-muted-label">Highest Grammar</div>
                      <div className="text-xl font-black text-body-dark mt-0.5">
                        {selectedUserMetrics?.highestGrammarScore
                          ? `${selectedUserMetrics.highestGrammarScore.percent}%`
                          : "No Drills"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Activity Logs Trail */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-label">
                  Recent Candidate Activity Logs
                </h4>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-plum/15 divide-y divide-plum/10 text-xs">
                  {auditLogs
                    .filter(
                      (l) =>
                        l.userName?.toLowerCase() === selectedUser.name?.toLowerCase() ||
                        l.accessId === selectedUser.id ||
                        l.accessId === selectedUser.accessId
                    )
                    .slice(0, 10)
                    .map((log) => (
                      <div key={log._id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-plum mr-2">[{log.action}]</span>
                          <span className="text-body-dark">{log.details}</span>
                        </div>
                        <span className="text-muted-label font-mono shrink-0 ml-2">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  {auditLogs.filter(
                    (l) =>
                      l.userName?.toLowerCase() === selectedUser.name?.toLowerCase() ||
                      l.accessId === selectedUser.id ||
                      l.accessId === selectedUser.accessId
                  ).length === 0 && (
                    <div className="p-4 text-center text-muted-label">
                      No recent activity logs recorded for this candidate.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-plum/15 gap-3">
                <div className="text-xs text-muted-label">
                  Permissions are updated immediately in the database.
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="imlaa-btn-secondary py-2 px-5 text-sm font-semibold w-full sm:w-auto"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
