import { useState, useEffect, useCallback } from "react";
import apiClient from "../services/apiClient";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { toCamel } from "../services/dataMappers";
import { recordAuditLog } from "../services/auditService";
import AuditLogTable from "../features/admin/AuditLogTable";
import UserInspector from "../features/admin/UserInspector";
import UserDirectory from "../features/admin/UserDirectory";
import { useModalEffects } from "../hooks/useModalEffects";
import {
  HiUsers,
  HiArrowPath,
  HiArrowDownTray,
  HiSignal,
  HiSparkles,
} from "react-icons/hi2";
import {
  showConfirmModal,
  showSuccessToast,
  showErrorAlert,
} from "../utils/sweetalert";
import { exportAuditReportPDF } from "../utils/exportReportPdf";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [auditStats, setAuditStats] = useState({
    totalRegistered: 0,
    approvedCount: 0,
    activeNowCount: 0,
  });
  const [auditUsers, setAuditUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserMetrics, setSelectedUserMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [selectedUserLogs, setSelectedUserLogs] = useState([]);
  const [selectedUserUploadedWords, setSelectedUserUploadedWords] = useState([]);
  const [loadingUserLogs, setLoadingUserLogs] = useState(false);

  useModalEffects(selectedUser, setSelectedUser, null);

  const handleOpenUserDetail = async (u) => {
    setSelectedUser(u);
    setLoadingMetrics(true);
    setLoadingUserLogs(true);
    setSelectedUserLogs([]);
    setSelectedUserUploadedWords([]);

    try {
      const res = await apiClient.get("/user/profile-metrics", {
        params: { userId: u.id },
      });
      if (res.data?.success) {
        setSelectedUserMetrics(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to fetch user metrics:", err);
    } finally {
      setLoadingMetrics(false);
    }

    try {
      // 1. Fetch user-specific audit & activity logs (Profile updates, uploads, role changes)
      const { data: logsData } = await supabase
        .from("audit_logs")
        .select("*")
        .or(`user_id.eq.${u.id},target_user_id.eq.${u.id}`)
        .order("timestamp", { ascending: false })
        .limit(30);
      setSelectedUserLogs(toCamel(logsData || []));
    } catch (logErr) {
      console.warn("Failed to fetch user logs:", logErr);
    }

    try {
      // 2. Fetch words uploaded by this user
      const { data: userWords } = await supabase
        .from("vocabularies")
        .select("id, word, pos, bangla_meaning, topic, created_at")
        .eq("uploaded_by_id", u.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setSelectedUserUploadedWords(toCamel(userWords || []));
    } catch (wordErr) {
      console.warn("Failed to fetch user uploaded words:", wordErr);
    } finally {
      setLoadingUserLogs(false);
    }
  };

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
  }, [fetchAuditData]);

  // Delete an uploaded word (Admin moderation)
  const handleDeleteUploadedWord = async (wordId, wordText) => {
    const res = await showConfirmModal({
      title: "Delete Uploaded Word?",
      text: `Are you sure you want to permanently delete "${wordText}" from uploaded vocabulary?`,
      confirmButtonText: "Accept / Delete",
      cancelButtonText: "Reject / Cancel",
      isDanger: true,
      icon: "warning",
    });

    if (!res.isConfirmed) return;

    try {
      const { error } = await supabase.from("vocabularies").delete().eq("id", wordId);
      if (error) throw error;

      setSelectedUserUploadedWords((prev) => prev.filter((w) => w.id !== wordId));
      showSuccessToast("Word Removed", `"${wordText}" deleted from database.`);

      // Log deletion
      try {
        await recordAuditLog({
          userId: user?.id,
          action: "VOCAB_DELETED",
          userName: user?.name || "Admin",
          targetUserId: selectedUser?.id || null,
          details: `Admin deleted uploaded word "${wordText}"`,
          timestamp: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn("Could not log deletion:", logErr);
      }
    } catch (err) {
      showErrorAlert("Delete Failed", err.message || "Failed to delete word");
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
        setAuditLogs((prev) => prev.filter((log) => log.id !== logId));
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

  // Change user role (General / Admin) with audit tracking and accept/reject confirmation
  const handleUpdateRole = async (userId, userName, newRole) => {
    const roleLabel = newRole === "admin" ? "Platform Administrator" : "General Member";
    const res = await showConfirmModal({
      title: "Confirm Role Change?",
      text: `Are you sure you want to change ${userName || "this candidate"}'s access role to [${roleLabel}]?`,
      confirmButtonText: "Accept / Confirm",
      cancelButtonText: "Reject / Cancel",
      isDanger: newRole !== "admin",
      icon: "question",
    });

    if (!res.isConfirmed) return;

    try {
      await apiClient.post("/admin/profile-role", {
        userId,
        role: newRole,
      });

      showSuccessToast(
        "Permissions Updated",
        `${userName || "Candidate"} has been granted [${roleLabel}] access.`
      );

      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => ({ ...prev, role: newRole }));
      }

      fetchAuditData();
    } catch (err) {
      showErrorAlert("Update Failed", err.message || "Failed to update role");
    }
  };

  const handleExportPDF = () => {
    exportAuditReportPDF({
      users: auditUsers,
      logs: auditLogs,
      stats: auditStats,
    });
  };

  const generalCount = auditUsers.filter((u) => u.role !== "admin").length;
  const adminCount = auditUsers.filter((u) => u.role === "admin").length;

  return (
    <div className="w-full flex flex-col space-y-8 animate-slide-up pb-12">
      {/* Header with Export & Refresh Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-plum/15">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-body-dark tracking-tight">
            Admin Dashboard
          </h2>
          <p className="text-xs sm:text-base text-muted-label mt-1">
            Manage candidate access permissions, monitor live sessions, and audit security events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchAuditData}
            title="Refresh Live Metrics"
            className="imlaa-btn-secondary py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-base space-x-1.5 min-h-11"
          >
            <HiArrowPath className={`w-4 h-4 sm:w-5 sm:h-5 ${loadingAudit ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="imlaa-btn-primary py-2 sm:py-2.5 px-4 sm:px-5 text-xs sm:text-base space-x-1.5 shadow-sm min-h-11"
          >
            <HiArrowDownTray className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Export Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. Live Overview Stats (Strict Platform Plum Family) */}
      {/* ==================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Metric 1: Currently Active Online */}
        <div className="imlaa-card p-4 sm:p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-label font-bold mb-1">
              Currently Active Online
            </div>
            <div className="text-3xl sm:text-4xl font-black text-body-dark font-mono flex items-center space-x-3">
              <span>{auditStats.activeNowCount}</span>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-xs sm:text-sm text-muted-label mt-1">
              Candidates in active session
            </div>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-plum/10 text-plum flex items-center justify-center shrink-0">
            <HiSignal className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Metric 2: Admin Members */}
        <div className="imlaa-card p-4 sm:p-6 border border-plum/20 bg-white flex items-center justify-between">
          <div>
            <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-label font-bold mb-1">
              Platform Admins
            </div>
            <div className="text-3xl sm:text-4xl font-black text-plum font-mono">
              {adminCount}
            </div>
            <div className="text-xs sm:text-sm text-muted-label mt-1">
              {adminCount} Administrator{adminCount === 1 ? "" : "s"} with authority
            </div>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-plum/10 text-plum flex items-center justify-center shrink-0">
            <HiSparkles className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Metric 3: Total Registered Candidates */}
        <div className="imlaa-card p-4 sm:p-6 border border-plum/20 bg-white flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <div className="text-xs sm:text-sm uppercase tracking-wider text-muted-label font-bold mb-1">
              Total Candidates
            </div>
            <div className="text-3xl sm:text-4xl font-black text-body-dark font-mono">
              {auditStats.totalRegistered}
            </div>
            <div className="text-xs sm:text-sm text-muted-label mt-1">
              {generalCount} Free members in registry
            </div>
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-plum/10 text-plum flex items-center justify-center shrink-0">
            <HiUsers className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
        </div>
      </div>

      <UserDirectory
        users={auditUsers}
        generalCount={generalCount}
        adminCount={adminCount}
        onOpenUser={handleOpenUserDetail}
        onUpdateRole={handleUpdateRole}
      />

      <AuditLogTable
        logs={auditLogs}
        onClear={handleClearAllLogs}
        onDelete={handleDeleteLog}
      />

      <UserInspector
        user={selectedUser}
        metrics={selectedUserMetrics}
        loadingMetrics={loadingMetrics}
        logs={selectedUserLogs}
        uploadedWords={selectedUserUploadedWords}
        loadingLogs={loadingUserLogs}
        auditLogs={auditLogs}
        onClose={() => setSelectedUser(null)}
        onUpdateRole={handleUpdateRole}
        onDeleteUploadedWord={handleDeleteUploadedWord}
      />
    </div>
  );
}
