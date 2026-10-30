import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import {
  HiShieldCheck,
  HiArrowRightOnRectangle,
  HiClock,
  HiAcademicCap,
  HiTrophy,
  HiComputerDesktop,
  HiCheckCircle,
  HiArrowPath,
  HiHeart,
  HiPencilSquare,
  HiCamera,
  HiCalendar,
  HiXMark,
  HiEnvelope,
  HiTrash,
} from "react-icons/hi2";
import { useNavigate, Link } from "react-router";
import { getDeviceInfo } from "../utils/deviceInfo";
import { showConfirmModal, showSuccessToast } from "../utils/sweetalert";
import { supabase } from "../services/apiClient";

export default function ProfilePage() {
  const { user, role, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const deviceInfo = getDeviceInfo();

  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalStudySeconds: 0,
    masteredCount: 0,
    inProgressCount: 0,
    totalVocabInCorpus: 0,
    highestGrammarScore: null,
  });
  const [profileMeta, setProfileMeta] = useState({
    createdAt: null,
    lastActiveAt: null,
  });
  const [loading, setLoading] = useState(true);

  // Profile Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editError, setEditError] = useState("");

  // Lock body scroll and handle ESC key when modal is open
  useEffect(() => {
    if (!isEditOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isUploading) {
        setIsEditOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditOpen, isUploading]);

  // Fetch candidate profile study metrics & timestamps
  useEffect(() => {
    let isMounted = true;
    const fetchMetrics = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const [
          { data: spellingData },
          { data: flashcardData },
          { data: grammarData },
          { count: totalVocab },
          { data: profileRecord },
        ] = await Promise.all([
          supabase.from("spelling_progress").select("*").eq("user_id", user.id),
          supabase.from("flashcard_progress").select("*").eq("user_id", user.id),
          supabase.from("grammar_progress").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("vocabularies").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("created_at, last_active_at").eq("id", user.id).maybeSingle(),
        ]);

        if (isMounted) {
          // Aggregate spelling + flashcard mastery
          let mastered = 0;
          let incorrect = 0;
          for (const sp of spellingData || []) {
            mastered += sp.mastered_words?.length || 0;
            incorrect += sp.incorrect_words?.length || 0;
          }

          setMetrics({
            totalSessions:
              (spellingData?.length || 0) + (flashcardData?.length || 0) || (mastered > 0 ? 1 : 0),
            totalStudySeconds: mastered * 30 + incorrect * 20,
            masteredCount: mastered,
            inProgressCount: incorrect,
            totalVocabInCorpus: totalVocab || 28,
            highestGrammarScore: grammarData?.highest_score
              ? { score: grammarData.highest_score, total: grammarData.total_questions || 4 }
              : null,
          });

          setProfileMeta({
            createdAt: profileRecord?.created_at || user?.createdAt || null,
            lastActiveAt: profileRecord?.last_active_at || user?.lastActiveAt || null,
          });
        }
      } catch (err) {
        console.warn("Could not fetch user profile metrics:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const formatTimeSpent = (seconds) => {
    if (!seconds || seconds <= 0) return "0 min";
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs} hrs`;
  };

  const formatFormattedDate = (isoStr) => {
    if (!isoStr) return "Recent Member";
    try {
      const d = new Date(isoStr);
      if (Number.isNaN(d.getTime())) return "Recent Member";
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Recent Member";
    }
  };

  const handleOpenEdit = () => {
    setEditName(user?.name || "");
    setAvatarPreview(user?.avatarUrl || null);
    setAvatarFile(null);
    setEditError("");
    setIsEditOpen(true);
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditError("Please select a valid image file (PNG, JPG, JPEG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setEditError("Selected photo is larger than 5MB. Please choose a smaller photo.");
      return;
    }

    setEditError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError("");
    setIsUploading(true);

    try {
      let finalAvatarUrl = avatarPreview;

      // If user selected a new file, upload to ImgBB
      if (avatarFile) {
        const formData = new FormData();
        formData.append("image", avatarFile);

        const imgbbRes = await fetch(
          "https://api.imgbb.com/1/upload?key=7c2f3a90374b4dfe4c951fe54501a00a",
          {
            method: "POST",
            body: formData,
          }
        );

        const imgbbData = await imgbbRes.json();
        if (!imgbbData.success) {
          throw new Error(imgbbData.error?.message || "Failed to upload image to ImgBB.");
        }

        finalAvatarUrl = imgbbData.data?.display_url || imgbbData.data?.url;
      }

      // Update Supabase profile & React context
      const res = await updateProfile({
        name: editName.trim() || user?.name,
        avatarUrl: finalAvatarUrl,
      });

      if (res.success) {
        showSuccessToast("Profile Updated", "Your profile credentials have been saved successfully.");
        setIsEditOpen(false);
      } else {
        setEditError(res.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Profile save error:", err);
      setEditError(err.message || "An unexpected error occurred while saving profile.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    const res = await showConfirmModal({
      title: "Sign Out?",
      text: "Are you sure you want to end your active session?",
      confirmButtonText: "Sign Out",
      cancelButtonText: "Stay Logged In",
      isDanger: false,
      icon: "question",
    });

    if (res.isConfirmed) {
      await logout();
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-slide-up pb-12">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-plum/15">
        <div>
          <h1 className="text-3xl font-black text-body-dark tracking-tight">
            User Profile & Learning Analytics
          </h1>
          <p className="text-lg text-muted-label mt-1">
            Personal academic record, session performance, and account credentials.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/support-us"
            className="imlaa-btn-secondary py-2.5 px-4 text-base space-x-2 text-plum hover:bg-plum/10"
          >
            <HiHeart className="w-5 h-5 text-plum" />
            <span>Support Us</span>
          </Link>
          <span className="imlaa-badge text-base py-1 px-4 uppercase font-bold tracking-wider">
            {role || "general"} Member
          </span>
        </div>
      </div>

      <div className="imlaa-card p-6 sm:p-8 space-y-8">
        {/* ==================================================== */}
        {/* User Identity Card (Platform Color Family Theme)     */}
        {/* ==================================================== */}
        <div className="p-6 rounded-2xl border border-plum/20 bg-plum/5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
            {/* Avatar Display */}
            <div className="relative group">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.name || "Avatar"}
                  className="w-22 h-22 rounded-2xl border-2 border-plum object-cover shadow-sm"
                />
              ) : (
                <div className="w-22 h-22 rounded-2xl bg-plum text-white flex items-center justify-center font-black text-3xl shadow-sm">
                  {(user?.name || user?.email || "C").charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={handleOpenEdit}
                title="Change Photo"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-plum text-white hover:bg-plum-hover shadow-md transition cursor-pointer"
              >
                <HiCamera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-bold text-body-dark">
                  {user?.name || "Candidate"}
                </h2>
                <span className="imlaa-badge text-xs py-0.5 px-2.5 uppercase font-bold tracking-wider">
                  {role || "General"}
                </span>

                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-plum/25 bg-white hover:bg-plum/10 text-plum text-xs font-bold transition shadow-2xs cursor-pointer ml-1"
                >
                  <HiPencilSquare className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="text-base text-muted-label font-medium flex items-center justify-center sm:justify-start space-x-2">
                <HiEnvelope className="w-4 h-4 text-plum/70 shrink-0" />
                <span>{user?.email}</span>
              </div>

              {/* Created At & Account Details */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-muted-label">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-plum/15 font-medium">
                  <HiCalendar className="w-3.5 h-3.5 text-plum" />
                  <span>
                    Member Since:{" "}
                    <strong className="text-body-dark">
                      {formatFormattedDate(profileMeta.createdAt || user?.createdAt)}
                    </strong>
                  </span>
                </div>

                <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-plum/15 font-mono">
                  <span>Auth:</span>
                  <strong className="text-body-dark capitalize">
                    {user?.authProvider || "email"}
                  </strong>
                </div>

                <div className="text-xs text-plum font-semibold">
                  ID: {user?.id?.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end space-y-2 shrink-0">
            <span className="text-xs uppercase font-bold text-muted-label tracking-wider">
              Subscription Status
            </span>
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full bg-plum/10 text-plum text-sm font-bold border border-plum/20">
              <HiShieldCheck className="w-4 h-4 text-plum" />
              <span>
                {role === "admin"
                  ? "Platform Admin"
                  : "General Member"}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Study Metrics & Academic Activity */}
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

            {/* Metric 3: Vocabulary Mastered */}
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

            {/* Metric 4: Grammar Drill */}
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
                  </span>
                ) : (
                  <span className="text-muted-label text-xl">Not started</span>
                )}
              </div>
              <div className="text-xs text-muted-label">
                Grammar questions mastered
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Environment Details */}
        <div className="p-6 rounded-2xl border border-plum/20 bg-plum/5 space-y-5">
          <div className="flex items-center justify-between border-b border-plum/15 pb-3">
            <div className="flex items-center space-x-2 text-plum">
              <HiComputerDesktop className="w-6 h-6" />
              <span className="text-lg font-bold text-body-dark">
                Client Device & Environment Details
              </span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Active Session
            </span>
          </div>

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
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/workspace/flashcard")}
              className="imlaa-btn-secondary w-full sm:w-auto py-3 px-6 text-base font-semibold"
            >
              Flashcards Drill
            </button>
            <button
              type="button"
              onClick={() => navigate("/workspace/spelling")}
              className="imlaa-btn-secondary w-full sm:w-auto py-3 px-6 text-base font-semibold"
            >
              Spelling Practice
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
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* Edit Profile Modal (Portaled Directly to Body)       */}
      {/* ==================================================== */}
      {isEditOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-9999 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isUploading) {
                setIsEditOpen(false);
              }
            }}
          >
            <div
              className="imlaa-card w-full max-w-lg bg-white border border-plum/20 shadow-2xl p-6 sm:p-8 space-y-6 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-plum/15">
                <div className="flex items-center space-x-2 text-plum">
                  <HiPencilSquare className="w-6 h-6" />
                  <h3 className="text-xl font-black text-body-dark">
                    Edit Profile Credentials
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => !isUploading && setIsEditOpen(false)}
                  className="text-muted-label hover:text-body-dark text-xl font-bold p-1 cursor-pointer"
                >
                  <HiXMark className="w-5 h-5" />
                </button>
              </div>

              {editError && (
                <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-sm font-medium animate-slide-up">
                  {editError}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Profile Photo Section (ImgBB Upload) */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-body-dark">
                    Profile Picture (Avatar)
                  </label>

                  <div className="flex items-center space-x-4">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="w-20 h-20 rounded-2xl border-2 border-plum object-cover shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-plum/15 text-plum font-black text-2xl flex items-center justify-center border-2 border-plum/30 shrink-0">
                        {(editName || user?.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="imlaa-btn-secondary py-2 px-3.5 text-xs font-bold space-x-1.5 cursor-pointer inline-flex items-center">
                        <HiCamera className="w-4 h-4 text-plum" />
                        <span>{avatarPreview ? "Change Photo" : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>

                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={isUploading}
                          className="imlaa-btn-secondary py-2 px-3 text-xs text-rose-700 border-rose-300 hover:bg-rose-50 flex items-center space-x-1 cursor-pointer"
                        >
                          <HiTrash className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}

                      <p className="text-[11px] text-muted-label">
                        Supports JPG, PNG, WebP up to 5MB. Hosted securely on ImgBB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full Name Field */}
                <div>
                  <label className="block text-sm font-semibold text-body-dark mb-1.5">
                    Candidate Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Ahasan Naeem"
                    required
                    disabled={isUploading}
                    className="imlaa-input py-3 px-3.5 text-base"
                  />
                </div>

                {/* Account Email (Read-Only) */}
                <div>
                  <label className="block text-sm font-semibold text-body-dark mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="imlaa-input py-3 pl-10 pr-3.5 text-base bg-plum/5 text-muted-label cursor-not-allowed"
                    />
                    <HiEnvelope className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-label" />
                  </div>
                  <p className="text-[11px] text-muted-label mt-1">
                    Email is bound to your Supabase security session and cannot be changed here.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-plum/15">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setIsEditOpen(false)}
                    className="imlaa-btn-secondary py-2.5 px-5 text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="imlaa-btn-primary py-2.5 px-6 text-sm font-bold space-x-2 cursor-pointer flex items-center"
                  >
                    {isUploading ? (
                      <>
                        <HiArrowPath className="w-4 h-4 animate-spin" />
                        <span>Uploading to ImgBB...</span>
                      </>
                    ) : (
                      <span>Save Credentials</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
