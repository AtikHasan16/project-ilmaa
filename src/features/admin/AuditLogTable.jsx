import { useState, useEffect } from "react";
import {
  HiTrash,
  HiChevronLeft,
  HiChevronRight,
  HiArrowDownTray,
} from "react-icons/hi2";

export default function AuditLogTable({ logs = [], onClear, onDelete }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));

  // Reset to first page if log collection size drastically changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [logs.length, totalPages, currentPage]);

  const displayedLogs = logs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleExportJson = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      platform: "Imlaa Linguistic Mastery Platform",
      systemVersion: "1.0.0",
      totalLogs: logs.length,
      integrity: "AUDIT_VERIFIED_EXPORT",
      logs,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imlaa_security_audit_trail_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="imlaa-card p-6 sm:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-plum/15">
        <div>
          <h3 className="text-xl font-bold text-body-dark">
            Security & Access Audit Trail
          </h3>
          <p className="text-base text-muted-label mt-0.5">
            Append-only 90-day retention trail with role promotions and security events.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <span className="imlaa-badge text-base">{logs.length} Events</span>
          {logs.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportJson}
                className="imlaa-btn-secondary min-h-11 py-2 px-3 text-sm text-plum border-plum/25 hover:bg-plum/5 flex items-center space-x-1.5 cursor-pointer"
                title="Export audit trail to JSON"
              >
                <HiArrowDownTray className="w-4 h-4" />
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={onClear}
                className="imlaa-btn-secondary min-h-11 py-2 px-3 text-sm text-rose-700 border-rose-300 hover:bg-rose-50 flex items-center space-x-1.5 cursor-pointer"
              >
                <HiTrash className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </>
          )}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-muted-label text-base">
          No audit log records recorded yet.
        </div>
      ) : (
        <>
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
                {displayedLogs.map((log) => (
                  <tr
                    key={log.id || log.timestamp}
                    className="hover:bg-plum/5 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-plum text-sm">
                      {log.action}
                    </td>
                    <td className="py-3 px-3 font-semibold text-body-dark">
                      {log.userName}{" "}
                      <span className="font-mono text-xs text-muted-label">
                        ({(log.targetUserId || log.userId)?.slice(0, 8) || "—"})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-body-dark">{log.details}</td>
                    <td className="py-3 px-3 font-mono text-sm text-muted-label whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(log.id)}
                        title="Delete log entry"
                        className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-lg text-muted-label hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-plum/10 text-sm">
              <span className="text-muted-label">
                Showing{" "}
                <strong className="text-body-dark">
                  {(currentPage - 1) * pageSize + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-body-dark">
                  {Math.min(currentPage * pageSize, logs.length)}
                </strong>{" "}
                of <strong className="text-body-dark">{logs.length}</strong>{" "}
                records
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="min-h-11 px-3.5 py-2 rounded-xl border border-plum/20 text-body-dark hover:bg-plum/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
                >
                  <HiChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <span className="px-3 py-2 font-semibold text-body-dark">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="min-h-11 px-3.5 py-2 rounded-xl border border-plum/20 text-body-dark hover:bg-plum/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
                >
                  <span>Next</span>
                  <HiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
