import { createPortal } from "react-dom";
import {
  HiCloudArrowUp,
  HiShieldCheck,
  HiTrash,
  HiXMark,
} from "react-icons/hi2";

function formatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function UserInspector({
  user,
  metrics,
  loadingMetrics,
  logs,
  uploadedWords,
  loadingLogs,
  auditLogs,
  onClose,
  onUpdateRole,
  onDeleteUploadedWord,
}) {
  if (!user || typeof document === "undefined") return null;

  const combinedLogs = [...logs];
  const existingIds = new Set(combinedLogs.map((log) => log.id));
  auditLogs
    .filter(
      (log) =>
        log.userId === user.id || log.targetUserId === user.id,
    )
    .forEach((log) => {
      if (!existingIds.has(log.id)) combinedLogs.push(log);
    });
  combinedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return createPortal(
    <div
      className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="imlaa-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white border border-plum/20 shadow-2xl space-y-6 my-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 border-b border-plum/15">
          <div className="flex items-center space-x-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-2xl border-2 border-plum object-cover shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-plum/15 text-plum font-bold flex items-center justify-center text-2xl border-2 border-plum/30">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-2xl font-black text-body-dark">
                  {user.name || "Candidate"}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    user.role === "admin"
                      ? "bg-plum text-white"
                      : "bg-plum/10 text-plum border border-plum/15"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "General"}
                </span>
              </div>
              <div className="text-sm text-muted-label mt-0.5">
                {user.email || "No email linked"} • Auth via{" "}
                {user.authProvider || "email"}
              </div>
              <div className="flex items-center space-x-3 mt-1 text-xs">
                {user.isOnline ? (
                  <span className="inline-flex items-center space-x-1.5 text-emerald-700 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Active Online Now</span>
                  </span>
                ) : (
                  <span className="text-muted-label">
                    Last Active:{" "}
                    {user.lastActiveAt
                      ? new Date(user.lastActiveAt).toLocaleString()
                      : "Never"}
                  </span>
                )}
                <span className="text-muted-label font-mono">
                  Member Since: {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-label hover:text-body-dark text-xl font-bold p-2 cursor-pointer"
          >
            <HiXMark className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 rounded-xl border border-plum/20 bg-plum/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-plum flex items-center space-x-1">
              <HiShieldCheck className="w-4 h-4 text-plum" />
              <span>Assigned Access Tier & Capabilities</span>
            </span>
            <span className="text-xs font-bold font-mono text-muted-label">
              ID: {user.id?.slice(0, 8)}
            </span>
          </div>
          <div className="text-xs text-muted-label leading-relaxed">
            {user.role === "admin" ? (
              <p className="text-body-dark font-medium">
                <strong className="text-plum">Platform Administrator:</strong>{" "}
                Full platform authority to manage candidate credentials, review
                audit trails, and alter system parameters.
              </p>
            ) : (
              <p>
                <strong className="text-body-dark">General Free Tier:</strong>{" "}
                Candidate has access to Core Vocabulary Flashcards, Spelling
                Drills, and standard Grammar tests.
              </p>
            )}
          </div>
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-body-dark mr-1">
              Quick Permissions:
            </span>
            <button
              type="button"
              onClick={() => onUpdateRole(user.id, user.name, "general")}
              disabled={user.role !== "admin"}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                user.role !== "admin"
                  ? "bg-plum/15 text-plum border border-plum/30 cursor-default"
                  : "bg-white hover:bg-plum/10 text-body-dark border border-plum/20 cursor-pointer"
              }`}
            >
              ↩ Set as General
            </button>
            <button
              type="button"
              onClick={() => onUpdateRole(user.id, user.name, "admin")}
              disabled={user.role === "admin"}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                user.role === "admin"
                  ? "bg-plum text-white font-bold shadow-xs cursor-default"
                  : "bg-plum/5 hover:bg-plum/15 text-plum font-bold border border-plum/25 cursor-pointer"
              }`}
            >
              🛡️ Promote to Admin
            </button>
          </div>
        </div>

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-label">
            Device & Browser Telemetry
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              ["Browser", user.deviceInfo?.browser || "Web Browser"],
              ["Operating System", user.deviceInfo?.os || "Desktop OS"],
              ["Platform Form", user.deviceInfo?.platform || "Desktop Workstation"],
              ["Display Specs", user.deviceInfo?.screenResolution || "1920 × 1080"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="p-3 rounded-xl bg-plum/5 border border-plum/10"
              >
                <div className="text-xs text-muted-label">{label}</div>
                <div className="font-bold text-body-dark mt-0.5 text-xs">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
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
                  {Math.round(((metrics?.totalStudySeconds || 0) % 3600) / 60)}{" "}
                  mins
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-plum/20">
                <div className="text-xs text-muted-label">Total Month Usage</div>
                <div className="text-xl font-black text-plum mt-0.5">
                  {Math.max(
                    1,
                    Math.round((metrics?.totalStudySeconds || 0) / 60),
                  )}{" "}
                  mins
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-plum/20">
                <div className="text-xs text-muted-label">Words Mastered</div>
                <div className="text-xl font-black text-plum mt-0.5">
                  {metrics?.masteredCount || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-plum/20">
                <div className="text-xs text-muted-label">Highest Grammar</div>
                <div className="text-xl font-black text-body-dark mt-0.5">
                  {metrics?.highestGrammarScore
                    ? `${metrics.highestGrammarScore.percent}%`
                    : "No Drills"}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-label">
              Candidate Activity Trail (Profile & Upload Logs)
            </h4>
            {loadingLogs && (
              <span className="text-[10px] text-plum animate-pulse">
                Syncing logs...
              </span>
            )}
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-plum/15 divide-y divide-plum/10 text-xs">
            {combinedLogs.length === 0 ? (
              <div className="p-4 text-center text-muted-label">
                No recent activity logs recorded for this candidate.
              </div>
            ) : (
              combinedLogs.slice(0, 15).map((log, index) => {
                const isProfile = log.action === "PROFILE_UPDATE";
                const isUpload =
                  log.action === "VOCAB_BULK_UPLOAD" ||
                  log.action === "VOCAB_UPLOADED";
                const isRole = log.action === "ROLE_CHANGE";
                const badgeClass = isProfile
                  ? "bg-purple-100 text-purple-800 border-purple-300"
                  : isUpload
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : isRole
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-plum/10 text-plum border-plum/20";
                const label = isProfile
                  ? "Profile Update"
                  : isUpload
                    ? "Vocab Upload"
                    : isRole
                      ? "Role Change"
                      : log.action;

                return (
                  <div
                    key={log.id || index}
                    className="p-2.5 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] border uppercase ${badgeClass}`}
                      >
                        {label}
                      </span>
                      <span className="text-body-dark font-medium">
                        {log.details}
                      </span>
                    </div>
                    <span className="text-muted-label font-mono shrink-0 ml-2 text-[11px]">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-label flex items-center space-x-1.5">
              <HiCloudArrowUp className="w-4 h-4 text-plum" />
              <span>
                Uploaded Words by this Candidate ({uploadedWords.length})
              </span>
            </h4>
            {uploadedWords.length > 0 && (
              <span className="text-[10px] text-muted-label font-medium">
                Deletable by admin
              </span>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-plum/15 divide-y divide-plum/10 text-xs bg-plum/5">
            {uploadedWords.length === 0 ? (
              <div className="p-4 text-center text-muted-label">
                This candidate has not uploaded any custom vocabulary yet.
              </div>
            ) : (
              uploadedWords.map((word) => (
                <div
                  key={word.id}
                  className="p-2.5 flex items-center justify-between bg-white hover:bg-plum/5 transition"
                >
                  <div>
                    <span className="font-bold text-body-dark mr-1.5">
                      {word.word}
                    </span>
                    <span className="italic text-muted-label text-[11px] mr-2">
                      ({word.pos || "—"})
                    </span>
                    <span className="text-body-dark">
                      {word.banglaMeaning}
                    </span>
                    <span className="ml-2 text-[10px] font-mono text-plum bg-plum/10 px-1.5 py-0.5 rounded">
                      {word.topic}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span className="text-[10px] text-muted-label font-mono">
                      {word.createdAt
                        ? new Date(word.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onDeleteUploadedWord(word.id, word.word)
                      }
                      title="Delete this word"
                      className="p-1 text-muted-label hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                    >
                      <HiTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-plum/15 gap-3">
          <div className="text-xs text-muted-label">
            Permissions are updated immediately in the database.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="imlaa-btn-secondary py-2 px-5 text-sm font-semibold w-full sm:w-auto"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
