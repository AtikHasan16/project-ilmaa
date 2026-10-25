import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  HiUser,
  HiIdentification,
  HiShieldCheck,
  HiDevicePhoneMobile,
  HiArrowRightOnRectangle,
  HiClock,
  HiAcademicCap,
  HiTrophy,
  HiComputerDesktop,
  HiCheckCircle,
  HiArrowPath,
} from "react-icons/hi2";
import { useNavigate } from "react-router";
import { getDeviceToken } from "../utils/deviceToken";
import { getDeviceInfo } from "../utils/deviceInfo";
import { showConfirmModal } from "../utils/sweetalert";
import apiClient from "../services/apiClient";

export default function ProfilePage() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const deviceToken = getDeviceToken();
  const deviceInfo = getDeviceInfo();

  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalStudySeconds: 0,
    masteredCount: 0,
    inProgressCount: 0,
    totalVocabInCorpus: 0,
    highestGrammarScore: null,
  });
  const [loading, setLoading] = useState(true);

  // Fetch candidate profile study metrics
  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      if (!user?.accessId) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get("/user/profile-metrics", {
          params: { accessId: user.accessId },
        });
        if (isMounted && res.data?.success) {
          setMetrics(res.data.data);
        }
      } catch (err) {
        console.warn("Could not fetch user profile study metrics:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Format study duration into hours / minutes
  const formatTimeSpent = (seconds) => {
    if (!seconds || seconds <= 0) return "0 min";
    const mins = Math.round(seconds / 60);
    if (mins < 60) {
      return `${mins} min`;
    }
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs} hrs`;
  };

  const handleLogout = async () => {
    const res = await showConfirmModal({
      title: "Sign Out & Lock Session?",
      text: "Are you sure you want to end your authorized session and return to the login portal?",
      confirmButtonText: "Sign Out",
      cancelButtonText: "Stay Logged In",
      isDanger: true,
      icon: "warning",
    });

    if (res.isConfirmed) {
      logout();
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-8 animate-slide-up pb-10">
      {/* Page Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div>
          <h1 className="text-3xl font-black text-body-dark tracking-tight">
            Candidate Profile & Analytics
          </h1>
          <p className="text-base text-muted-label mt-1">
            Academic credential overview, study metrics, and bound device telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl text-base font-semibold self-start md:self-auto">
          <HiShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Authorized Hardware Binding</span>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="imlaa-card p-8 sm:p-10 flex flex-col space-y-8 border border-plum/20 rounded-2xl bg-white shadow-xs">
        {/* Candidate Identity Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-plum/15">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl bg-plum/10 border border-plum/25 flex items-center justify-center text-plum font-black text-3xl select-none uppercase shadow-xs">
              {(user?.name || "C").charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-body-dark">
                  {user?.name || "Candidate"}
                </h2>
                <span className="imlaa-badge text-base py-0.5 px-3 uppercase font-semibold">
                  {role || "General"}
                </span>
              </div>
              <div className="text-base text-muted-label mt-1 font-medium">
                Candidate Account ID: <span className="font-mono text-plum font-bold tracking-wider">{user?.accessId || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* Section 1: Study Metrics & Academic Activity        */}
        {/* ==================================================== */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-body-dark flex items-center space-x-2">
              <HiAcademicCap className="w-6 h-6 text-plum" />
              <span>Study Performance & Metrics</span>
            </h3>
            {loading && (
              <span className="text-sm text-plum animate-pulse flex items-center space-x-1">
                <HiArrowPath className="w-4 h-4 animate-spin" />
                <span>Syncing metrics...</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Study Sessions */}
            <div className="p-5 rounded-xl border border-plum/20 bg-plum/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-muted-label">
                <span className="text-sm font-bold uppercase tracking-wider text-plum">
                  Study Sessions
                </span>
                <HiClock className="w-5 h-5 text-plum" />
              </div>
              <div className="text-3xl font-black text-body-dark font-mono">
                {metrics.totalSessions}
              </div>
              <div className="text-xs text-muted-label">
                Interactive drills launched
              </div>
            </div>

            {/* Metric 2: Time Spent */}
            <div className="p-5 rounded-xl border border-plum/20 bg-plum/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-muted-label">
                <span className="text-sm font-bold uppercase tracking-wider text-plum">
                  Time Spent
                </span>
                <HiClock className="w-5 h-5 text-plum" />
              </div>
              <div className="text-3xl font-black text-body-dark font-mono">
                {formatTimeSpent(metrics.totalStudySeconds)}
              </div>
              <div className="text-xs text-muted-label">
                Total active practice duration
              </div>
            </div>

            {/* Metric 3: Vocabulary Mastered vs In-Progress */}
            <div className="p-5 rounded-xl border border-plum/20 bg-plum/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-muted-label">
                <span className="text-sm font-bold uppercase tracking-wider text-plum">
                  Vocabulary Mastery
                </span>
                <HiCheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-emerald-700 font-mono">
                  {metrics.masteredCount}
                </span>
                <span className="text-base text-muted-label font-medium">
                  / {metrics.inProgressCount} review
                </span>
              </div>
              <div className="text-xs text-muted-label">
                {metrics.masteredCount} Mastered vs {metrics.inProgressCount} In-Progress
              </div>
            </div>

            {/* Metric 4: Highest Grammar Drill Score */}
            <div className="p-5 rounded-xl border border-plum/20 bg-plum/5 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-muted-label">
                <span className="text-sm font-bold uppercase tracking-wider text-plum">
                  Highest Grammar Drill
                </span>
                <HiTrophy className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-3xl font-black text-body-dark font-mono">
                {metrics.highestGrammarScore ? (
                  <span className="text-plum">
                    {metrics.highestGrammarScore.score}/{metrics.highestGrammarScore.total}
                    <span className="text-lg font-bold ml-1 text-muted-label">
                      ({metrics.highestGrammarScore.percent}%)
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-label text-xl">No Drills Yet</span>
                )}
              </div>
              <div className="text-xs text-muted-label">
                {metrics.highestGrammarScore ? "Peak recorded accuracy" : "Launch a drill to calibrate"}
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* Section 2: Candidate Credentials Details            */}
        {/* ==================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-plum/10">
          {/* 10-Digit Access ID */}
          <div className="p-5 rounded-xl border border-plum/20 bg-white flex flex-col justify-between space-y-3">
            <div className="flex items-center space-x-2 text-plum">
              <HiIdentification className="w-6 h-6" />
              <span className="text-base font-bold uppercase tracking-wider">
                Permanent Access ID
              </span>
            </div>
            <div className="text-3xl font-mono font-black text-plum tracking-widest">
              {user?.accessId || "—"}
            </div>
            <div className="text-base text-muted-label">
              10-digit candidate key permanently registered to this profile.
            </div>
          </div>

          {/* User Name */}
          <div className="p-5 rounded-xl border border-plum/20 bg-white flex flex-col justify-between space-y-3">
            <div className="flex items-center space-x-2 text-plum">
              <HiUser className="w-6 h-6" />
              <span className="text-base font-bold uppercase tracking-wider">
                Full Registered Name
              </span>
            </div>
            <div className="text-2xl font-bold text-body-dark truncate">
              {user?.name || "—"}
            </div>
            <div className="text-base text-muted-label">
              Identity verified under institutional academic roster.
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* Section 3: Connected Hardware & Device Telemetry    */}
        {/* ==================================================== */}
        <div className="p-6 rounded-2xl border border-plum/20 bg-plum/5 space-y-5">
          <div className="flex items-center justify-between border-b border-plum/15 pb-3">
            <div className="flex items-center space-x-2 text-plum">
              <HiComputerDesktop className="w-6 h-6" />
              <span className="text-lg font-bold text-body-dark">
                Connected Hardware & Environment Details
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Active Connection
            </span>
          </div>

          {/* Telemetry specs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-plum/15">
              <div className="text-xs uppercase font-bold text-muted-label">Operating System</div>
              <div className="text-base font-bold text-body-dark mt-1">{deviceInfo.os}</div>
              <div className="text-xs text-muted-label mt-0.5">{deviceInfo.platform}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-plum/15">
              <div className="text-xs uppercase font-bold text-muted-label">Current Browser</div>
              <div className="text-base font-bold text-body-dark mt-1">{deviceInfo.browser}</div>
              <div className="text-xs text-muted-label mt-0.5">Language: {deviceInfo.language}</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-plum/15">
              <div className="text-xs uppercase font-bold text-muted-label">Display & Viewport</div>
              <div className="text-base font-bold text-body-dark mt-1 font-mono">{deviceInfo.screenResolution}</div>
              <div className="text-xs text-muted-label mt-0.5">High-DPI Calibrated</div>
            </div>
          </div>

          {/* Hardware Token details */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center space-x-2 text-plum">
              <HiDevicePhoneMobile className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider text-body-dark">
                Cryptographic Hardware Token
              </span>
            </div>
            <div className="font-mono text-sm text-body-dark bg-white p-3.5 rounded-xl border border-plum/15 break-all">
              {deviceToken || "No device token bound"}
            </div>
            <p className="text-sm text-muted-label leading-relaxed">
              Security Notice: Your 10-digit Access ID is securely locked to this browser and hardware fingerprint.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/workspace/vocab")}
              className="imlaa-btn-secondary w-full sm:w-auto py-3 px-6 text-base font-semibold"
            >
              Vocabulary Practice
            </button>
            <button
              type="button"
              onClick={() => navigate("/workspace/grammar")}
              className="imlaa-btn-secondary w-full sm:w-auto py-3 px-6 text-base font-semibold"
            >
              Grammar Drills
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="imlaa-btn-primary w-full sm:w-auto py-3 px-6 text-base space-x-2 bg-rose-700 hover:bg-rose-800 cursor-pointer"
          >
            <HiArrowRightOnRectangle className="w-5 h-5" />
            <span>Sign Out & Lock Device</span>
          </button>
        </div>
      </div>
    </div>
  );
}

