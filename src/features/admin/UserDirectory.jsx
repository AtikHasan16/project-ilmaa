import { useState, useEffect } from "react";
import {
  HiInformationCircle,
  HiMagnifyingGlass,
  HiShieldCheck,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";

export default function UserDirectory({
  users = [],
  generalCount,
  adminCount,
  onOpenUser,
  onUpdateRole,
}) {
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const filteredUsers = users.filter((user) => {
    const role = user.role === "admin" ? "admin" : "general";
    const matchesRole = roleFilter === "all" || role === roleFilter;
    const matchesSearch =
      !normalizedQuery ||
      user.name?.toLowerCase().includes(normalizedQuery) ||
      user.email?.toLowerCase().includes(normalizedQuery) ||
      user.id?.toLowerCase().includes(normalizedQuery);
    return matchesRole && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  // Reset to first page when search query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const displayedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <section className="imlaa-card p-6 sm:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-plum/15">
        <div>
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-body-dark">
              Candidate Access Directory
            </h3>
            <button
              type="button"
              onClick={() => setShowPermissionGuide((visible) => !visible)}
              className="inline-flex items-center space-x-1 text-xs font-bold text-plum hover:underline cursor-pointer"
            >
              <HiInformationCircle className="w-4 h-4" />
              <span>
                {showPermissionGuide ? "Hide Tier Guide" : "View Tier Guide"}
              </span>
            </button>
          </div>
          <p className="text-base text-muted-label mt-0.5">
            Full directory of registered users with role assignments and
            privilege controls.
          </p>
        </div>
        <span className="imlaa-badge text-base">
          {filteredUsers.length} / {users.length} Candidates
        </span>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white border border-plum/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-plum uppercase text-xs">
                  General Member
                </span>
                <span className="imlaa-badge text-[11px] py-0.5 px-2">
                  Free
                </span>
              </div>
              <ul className="text-muted-label space-y-1.5 list-disc list-inside">
                <li>Full Flashcards & Spelling drills</li>
                <li>Standard Grammar interactive quizzes</li>
                <li>Personal learning metrics & progress tracking</li>
                <li>Standard visitor rate limit queues</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-plum/10 border border-plum/35 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-plum uppercase text-xs">
                  Platform Admin
                </span>
                <span className="px-2 py-0.5 rounded-full bg-plum text-white text-[11px] font-bold">
                  Authority
                </span>
              </div>
              <ul className="text-muted-label space-y-1.5 list-disc list-inside">
                <li>Complete access candidate management & inspection</li>
                <li>Security audit trails, event inspection, and deletions</li>
                <li>Corpus topic deletions, additions, and moderation</li>
                <li>System-wide analytics and performance reports</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 bg-plum/5 p-1 rounded-xl border border-plum/15 self-start">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === "all"
                ? "bg-plum text-white shadow-xs"
                : "text-muted-label hover:text-body-dark"
            }`}
          >
            All Candidates ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("general")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === "general"
                ? "bg-plum text-white shadow-xs"
                : "text-muted-label hover:text-body-dark"
            }`}
          >
            General ({generalCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === "admin"
                ? "bg-plum text-white shadow-xs"
                : "text-muted-label hover:text-body-dark"
            }`}
          >
            Admins ({adminCount})
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <HiMagnifyingGlass className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-label" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search candidate name, email, or ID..."
            className="imlaa-input text-xs pl-9 py-2 pr-3 w-full rounded-xl bg-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-base">
          <thead>
            <tr className="border-b border-plum/20 text-muted-label uppercase text-sm font-bold">
              <th className="py-3 px-3">Candidate</th>
              <th className="py-3 px-3">Email & Auth</th>
              <th className="py-3 px-3">Assigned Role</th>
              <th className="py-3 px-3">Presence</th>
              <th className="py-3 px-3 text-right">Modify Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum/10">
            {displayedUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-muted-label text-base"
                >
                  No registered candidates match your search filters.
                </td>
              </tr>
            ) : (
              displayedUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => onOpenUser(user)}
                  className="hover:bg-plum/5 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-3">
                    <div className="flex items-center space-x-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name || "User"}
                          className="w-9 h-9 rounded-full object-cover border border-plum/20"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-plum/10 text-plum font-bold flex items-center justify-center text-sm border border-plum/20">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-body-dark group-hover:text-plum transition-colors flex items-center space-x-1.5">
                          <span>{user.name || "Candidate"}</span>
                          <span className="text-[10px] text-plum bg-plum/10 px-1.5 py-0.2 rounded font-semibold">
                            Inspect
                          </span>
                        </div>
                        <div className="text-xs text-muted-label font-mono">
                          ID: {user.id?.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="text-sm font-medium text-body-dark">
                      {user.email || "—"}
                    </div>
                    <div className="text-xs text-muted-label uppercase font-mono">
                      Via {user.authProvider || "email"}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        user.role === "admin"
                          ? "bg-plum text-white"
                          : "bg-plum/5 text-muted-label border border-plum/15"
                      }`}
                    >
                      {user.role === "admin" ? "Admin" : "General"}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {user.isOnline ? (
                      <span className="inline-flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Active Now</span>
                      </span>
                    ) : (
                      <span className="text-muted-label text-sm">
                        {user.lastActiveAt
                          ? `Seen ${new Date(user.lastActiveAt).toLocaleDateString()}`
                          : "Never logged in"}
                      </span>
                    )}
                  </td>
                  <td
                    className="py-3.5 px-3 text-right"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-end">
                      <select
                        value={user.role === "admin" ? "admin" : "general"}
                        onChange={(event) =>
                          onUpdateRole(
                            user.id,
                            user.name,
                            event.target.value,
                          )
                        }
                        className="imlaa-input text-xs py-1.5 px-3 bg-white font-semibold border-plum/25 text-body-dark hover:border-plum focus:border-plum cursor-pointer rounded-xl max-w-37.5"
                      >
                        <option value="general">General Member</option>
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

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-plum/10 text-sm">
          <span className="text-muted-label">
            Showing{" "}
            <strong className="text-body-dark">
              {(currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-body-dark">
              {Math.min(currentPage * pageSize, filteredUsers.length)}
            </strong>{" "}
            of <strong className="text-body-dark">{filteredUsers.length}</strong>{" "}
            candidates
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="min-h-11 px-3.5 py-2 rounded-xl border border-plum/20 text-body-dark hover:bg-plum/5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
            >
              <span>Next</span>
              <HiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
