import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import {
  HiShieldCheck,
  HiArrowRightOnRectangle,
  HiAcademicCap,
  HiComputerDesktop,
  HiArrowPath,
  HiHeart,
  HiPencilSquare,
  HiCamera,
  HiCalendar,
  HiXMark,
  HiEnvelope,
  HiTrash,
  HiTrophy,
  HiArrowDownTray,
  HiSparkles,
} from "react-icons/hi2";
import { useNavigate, Link } from "react-router";
import { getDeviceInfo } from "../utils/deviceInfo";
import { showConfirmModal, showSuccessToast } from "../utils/sweetalert";
import { supabase } from "../services/supabaseClient";
import { useModalEffects } from "../hooks/useModalEffects";
import { getAvatarColor, getInitials } from "../utils/avatarColors";
import { fetchUserBadges } from "../services/badgeService";
import { exportStudyCertificatePDF } from "../utils/exportCertificatePdf";
import BadgesModal from "../components/BadgesModal";
import { toCamel } from "../services/dataMappers";

export default function ProfilePage() {
  const { user, role, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const deviceInfo = getDeviceInfo();

  const [profileMeta, setProfileMeta] = useState({
    createdAt: null,
    lastActiveAt: null,
  });

  const [userBadges, setUserBadges] = useState([]);
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);
  const [studyMetrics, setStudyMetrics] = useState({
    masteredWordsCount: 0,
    totalPracticeSessions: 0,
    totalStudySeconds: 0,
    grammarScore: null,
  });

  // Profile Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editError, setEditError] = useState("");

  useModalEffects(isEditOpen, setIsEditOpen, false, !isUploading);

  const fetchProfileAndStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [
        { data: profileRecord },
        { data: rawSpellingRows },
        { data: rawFlashcardRows },
        { data: rawGrammarData },
        badges,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("created_at, last_active_at")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("spelling_progress").select("*").eq("user_id", user.id),
        supabase.from("flashcard_progress").select("*").eq("user_id", user.id),
        supabase.from("grammar_progress").select("*").eq("user_id", user.id).maybeSingle(),
        fetchUserBadges(user.id),
      ]);

      setProfileMeta({
        createdAt: profileRecord?.created_at || user?.createdAt || null,
        lastActiveAt: profileRecord?.last_active_at || user?.lastActiveAt || null,
      });

      setUserBadges(badges || []);

      const spellingRows = toCamel(rawSpellingRows || []);
      const flashcardRows = toCamel(rawFlashcardRows || []);
      const grammarData = toCamel(rawGrammarData);

      const uniqueMastered = new Set();
      spellingRows.forEach((r) => (r.masteredWords || []).forEach((w) => uniqueMastered.add(w)));
      flashcardRows.forEach((r) => (r.knownWords || []).forEach((w) => uniqueMastered.add(w)));

      const totalPractices =
        spellingRows.length +
        flashcardRows.length +
        (grammarData?.testsTaken || (grammarData?.highestScore ? 1 : 0));

      setStudyMetrics({
        masteredWordsCount: uniqueMastered.size,
        totalPracticeSessions: totalPractices,
        totalStudySeconds: uniqueMastered.size * 35 + totalPractices * 60,
        grammarScore: grammarData?.highestScore
          ? { score: grammarData.highestScore, total: grammarData.totalQuestions || 0 }
          : null,
      });
    } catch (err) {
      console.warn("Could not load user profile details:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileAndStats();
  }, [fetchProfileAndStats]);

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

        const imgbbApiKey = import.meta.env.VITE_IMAGEBB_KEY;
        if (!imgbbApiKey) {
          throw new Error("Image uploads are not configured. Please contact support.");
        }

        const imgbbRes = await fetch(
          `https://api.imgbb.com/1/upload?key=${imgbbApiKey}`,
          {
            method: "POST",
            body: formData,
          },
        );

        const imgbbData = await imgbbRes.json();
        if (!imgbbData.success) {
          throw new Error(
            imgbbData.error?.message || "Failed to upload image to ImgBB.",
          );
        }

        finalAvatarUrl = imgbbData.data?.display_url || imgbbData.data?.url;
      }

      // Update Supabase profile & React context
      const res = await updateProfile({
        name: editName.trim() || user?.name,
        avatarUrl: finalAvatarUrl,
      });

      if (res.success) {
        showSuccessToast(
          "Profile Updated",
          "Your profile credentials have been saved successfully.",
        );
        setIsEditOpen(false);
      } else {
        setEditError(res.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Profile save error:", err);
      setEditError(
        err.message || "An unexpected error occurred while saving profile.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleExportCertificate = () => {
    exportStudyCertificatePDF({ user, metrics: studyMetrics, role });
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

  const avatarColor = getAvatarColor(user?.name);
  const initials = getInitials(user?.name);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-slide-up pb-12">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-plum/15">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-body-dark tracking-tight">
            User Profile & Learning Analytics
          </h1>
          <p className="text-xs sm:text-base text-muted-label mt-1">
            Personal academic record, session performance, and account credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:space-x-3 self-start sm:self-auto">
          {/* Export Certificate Button */}
          <button
            type="button"
            onClick={handleExportCertificate}
            title="Export Verified Study Certificate"
            className="imlaa-btn-primary py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-base space-x-1.5 min-h-11 shadow-sm"
          >
            <HiArrowDownTray className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Export Certificate</span>
          </button>

          <Link
            to="/support-us"
            className="imlaa-btn-secondary py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-base space-x-1.5 text-plum hover:bg-plum/10 min-h-11"
          >
            <HiHeart className="w-4 h-4 sm:w-5 sm:h-5 text-plum shrink-0" />
            <span>Support Us</span>
          </Link>
          <span className="imlaa-badge text-xs sm:text-base py-1 px-3 sm:px-4 uppercase font-bold tracking-wider">
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
                <div
                  className="w-22 h-22 rounded-2xl text-white flex items-center justify-center font-black text-3xl shadow-sm"
                  style={{ backgroundColor: avatarColor.bg }}
                >
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={handleOpenEdit}
                title="Change Photo"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-plum text-white hover:bg-plum-hover shadow-md transition cursor-pointer min-h-8 min-w-8 flex items-center justify-center"
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
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border border-plum/25 bg-white hover:bg-plum/10 text-plum text-xs font-bold transition shadow-2xs cursor-pointer ml-1 min-h-9"
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
                {role === "admin" ? "Platform Admin" : "General Member"}
              </span>
            </div>
          </div>
        </div>

        {/* Badges & Milestones Showcase Banner */}
        <div className="p-6 rounded-2xl border border-plum/20 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start space-x-2 text-plum font-bold">
              <HiTrophy className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-body-dark">
                Milestones & Achievement Badges
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                {userBadges.length} Unlocked
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-label max-w-xl leading-relaxed">
              Earn badges for vocabulary mastery thresholds, drill practice milestones, and grammar accuracy.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsBadgesOpen(true)}
              className="imlaa-btn-secondary py-2.5 px-5 text-xs sm:text-sm font-bold text-plum space-x-1.5 min-h-11"
            >
              <HiSparkles className="w-4 h-4 text-amber-600" />
              <span>View Badges Catalog</span>
            </button>
          </div>
        </div>

        {/* Learning Analytics Portal Card */}
        <div className="p-5 sm:p-6 rounded-2xl border border-plum/20 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-body-dark flex items-center space-x-2">
              <HiAcademicCap className="w-5 h-5 text-plum" />
              <span>Study Analytics & Learning Performance</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-label max-w-xl">
              Track your real-time vocabulary progress, practice drill counts, completed corpus sets, and active spelling mistakes on your learning dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/workspace/dashboard")}
            className="imlaa-btn-primary py-2.5 px-5 text-xs sm:text-sm font-semibold shrink-0 space-x-2 self-start sm:self-auto min-h-11"
          >
            <span>Open Learning Dashboard</span>
            <span>&rarr;</span>
          </button>
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
              <div className="text-xs uppercase font-bold text-muted-label">
                Operating System
              </div>
              <div className="text-base font-bold text-body-dark mt-1">
                {deviceInfo.os}
              </div>
              <div className="text-xs text-muted-label mt-0.5">
                {deviceInfo.platform}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-plum/15">
              <div className="text-xs uppercase font-bold text-muted-label">
                Current Browser
              </div>
              <div className="text-base font-bold text-body-dark mt-1">
                {deviceInfo.browser}
              </div>
              <div className="text-xs text-muted-label mt-0.5">
                Language: {deviceInfo.language}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-plum/15">
              <div className="text-xs uppercase font-bold text-muted-label">
                Display & Viewport
              </div>
              <div className="text-base font-bold text-body-dark mt-1 font-mono">
                {deviceInfo.screenResolution}
              </div>
              <div className="text-xs text-muted-label mt-0.5">
                High-DPI Calibrated
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate("/workspace/dashboard")}
              className="imlaa-btn-secondary w-full sm:w-auto py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold min-h-11 text-plum border-plum/30 bg-plum/5 hover:bg-plum/10"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate("/workspace/flashcard")}
              className="imlaa-btn-secondary w-full sm:w-auto py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold min-h-11"
            >
              Flashcards Drill
            </button>
            <button
              type="button"
              onClick={() => navigate("/workspace/spelling")}
              className="imlaa-btn-secondary w-full sm:w-auto py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold min-h-11"
            >
              Spelling Practice
            </button>
            <button
              type="button"
              onClick={() => navigate("/workspace/grammar")}
              className="imlaa-btn-secondary w-full sm:w-auto py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base font-semibold min-h-11"
            >
              Grammar Drills
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="imlaa-btn-primary w-full sm:w-auto py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base space-x-2 bg-rose-700 hover:bg-rose-800 cursor-pointer min-h-11"
          >
            <HiArrowRightOnRectangle className="w-5 h-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
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
                  className="text-muted-label hover:text-body-dark text-xl font-bold p-1 cursor-pointer min-h-8 min-w-8"
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
                      <div
                        className="w-20 h-20 rounded-2xl text-white font-black text-2xl flex items-center justify-center shadow-sm shrink-0"
                        style={{ backgroundColor: avatarColor.bg }}
                      >
                        {initials}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="imlaa-btn-secondary py-2 px-3.5 text-xs font-bold space-x-1.5 cursor-pointer inline-flex items-center min-h-10">
                        <HiCamera className="w-4 h-4 text-plum" />
                        <span>
                          {avatarPreview ? "Change Photo" : "Upload Photo"}
                        </span>
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
                          className="imlaa-btn-secondary py-2 px-3 text-xs text-rose-700 border-rose-300 hover:bg-rose-50 flex items-center space-x-1 cursor-pointer min-h-10"
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
                    className="imlaa-btn-secondary py-2.5 px-5 text-sm font-semibold cursor-pointer min-h-11"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="imlaa-btn-primary py-2.5 px-6 text-sm font-bold space-x-2 cursor-pointer flex items-center min-h-11"
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
          document.body,
        )}

      {/* Badges Modal */}
      <BadgesModal
        isOpen={isBadgesOpen}
        onClose={() => setIsBadgesOpen(false)}
        userBadges={userBadges}
      />
    </div>
  );
}
