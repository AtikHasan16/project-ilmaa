import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router";
import { HiVolumeUp } from "react-icons/hi";
import {
  HiArrowRight,
  HiShieldCheck,
  HiEnvelope,
  HiKey,
  HiHeart,
  HiArrowLeft,
  HiArrowPath,
} from "react-icons/hi2";
import { FaLinkedin, FaGithub } from "react-icons/fa6";
import { speakWithMicrosoftTTS } from "../utils/speechTts";

export default function LandingPage() {
  // Modes: 'signin' | 'signup' | 'otp' | 'forgot' | 'reset_password'
  const [authMode, setAuthMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Forgot password & reset states
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [isGoogleAlert, setIsGoogleAlert] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);

  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    verifyEmailOtp,
    resendVerificationCode,
    sendPasswordResetEmail,
    resetPasswordWithOtp,
    isAuthenticated,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/workspace/flashcard");
    }
  }, [isAuthenticated, navigate]);

  // Live Password Strength Meter
  const getPasswordStrength = (pass) => {
    if (!pass)
      return { score: 0, label: "", color: "bg-plum/20 text-muted-label" };
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 25;
    if (/\d/.test(pass)) score += 25;

    if (score <= 25)
      return {
        score: 25,
        label: "Weak (add letters & numbers)",
        color: "bg-rose-500 text-rose-600",
      };
    if (score <= 50)
      return {
        score: 50,
        label: "Fair (mix case & numbers)",
        color: "bg-amber-500 text-amber-600",
      };
    if (score <= 75)
      return { score: 75, label: "Good", color: "bg-blue-500 text-blue-600" };
    return {
      score: 100,
      label: "Strong",
      color: "bg-emerald-500 text-emerald-600",
    };
  };

  const strength = getPasswordStrength(password);
  const resetStrength = getPasswordStrength(newPassword);

  // Handle Google 1-Click Login
  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setInfoMessage("");
    setIsGoogleAlert(false);
    setGoogleLoading(true);
    const res = await signInWithGoogle();
    if (!res.success) {
      setErrorMessage(res.message);
      setGoogleLoading(false);
    }
  };

  // Handle Resending OTP
  const handleResendOtp = async () => {
    if (!email.trim() || resending) return;
    setResending(true);
    setErrorMessage("");
    setInfoMessage("");
    try {
      const res = await resendVerificationCode(email);
      if (res.success) {
        setInfoMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setResending(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    setIsGoogleAlert(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    // 1. Sign In Mode
    if (authMode === "signin") {
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      setSubmitting(true);
      try {
        const res = await signInWithEmail(cleanEmail, password);
        if (res.success) {
          navigate("/workspace/flashcard");
        } else {
          setErrorMessage(res.message);
          if (res.isGoogleAccount) {
            setIsGoogleAlert(true);
          }
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // 2. Sign Up Mode
    if (authMode === "signup") {
      if (!fullName.trim()) {
        setErrorMessage(
          "Please provide your full name for your candidate record.",
        );
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      setSubmitting(true);
      try {
        const res = await signUpWithEmail(cleanEmail, password, fullName);
        if (res.success) {
          if (res.requiresOtp) {
            setAuthMode("otp");
            setInfoMessage(
              "A 6-digit verification code was sent to your email. Enter it below to activate your account.",
            );
          } else {
            navigate("/workspace/flashcard");
          }
        } else {
          setErrorMessage(res.message);
          if (res.isGoogleAccount) {
            setIsGoogleAlert(true);
          }
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // 3. Signup Email OTP Verification
    if (authMode === "otp") {
      const cleanOtp = otpCode.replace(/[^0-9a-zA-Z]/g, "").trim();
      if (cleanOtp.length < 4) {
        setErrorMessage("Please enter the complete 6-digit verification code.");
        return;
      }
      setSubmitting(true);
      try {
        const res = await verifyEmailOtp(cleanEmail, cleanOtp);
        if (res.success) {
          navigate("/workspace/flashcard");
        } else {
          setErrorMessage(res.message);
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // 4. Forgot Password Email Dispatch
    if (authMode === "forgot") {
      setSubmitting(true);
      try {
        const res = await sendPasswordResetEmail(cleanEmail);
        if (res.success) {
          setAuthMode("reset_password");
          setInfoMessage(res.message);
        } else {
          setErrorMessage(res.message);
          if (res.isGoogleAccount) {
            setIsGoogleAlert(true);
          }
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // 5. Reset Password with 8-digit OTP Code
    if (authMode === "reset_password") {
      const cleanCode = recoveryCode.replace(/[^0-9a-zA-Z]/g, "").trim();
      if (cleanCode.length < 4) {
        setErrorMessage("Please enter the complete recovery code.");
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage("New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("Passwords do not match. Please verify.");
        return;
      }
      setSubmitting(true);
      try {
        const res = await resetPasswordWithOtp(
          cleanEmail,
          cleanCode,
          newPassword,
        );
        if (res.success) {
          setInfoMessage(res.message);
          setTimeout(() => {
            navigate("/workspace/flashcard");
          }, 1000);
        } else {
          setErrorMessage(res.message);
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  const playPhonemeSample = () => {
    speakWithMicrosoftTTS("Imlaa", {
      voice: "en-US-ChristopherNeural",
      onStart: () => setPlayingAudio(true),
      onEnd: () => setPlayingAudio(false),
      onError: () => setPlayingAudio(false),
    });
  };

  return (
    <div className="min-h-screen w-full bg-white text-body-dark flex flex-col justify-between px-3 sm:px-6 md:px-8 pt-4 sm:pt-6 overflow-x-hidden">
      {/* Top Navbar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between pb-4 sm:pb-6 gap-3">
        <div className="flex items-center space-x-2 shrink-0">
          <span className="font-black text-xl sm:text-2xl tracking-tight text-body-dark">
            Imlaa<span className="text-plum">.</span>
          </span>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-plum/10 text-plum text-xs font-bold tracking-wide">
            IELTS Orthography
          </span>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-5 text-xs sm:text-sm font-semibold">
          <Link
            to="/about"
            className="text-muted-label hover:text-plum transition min-h-11 flex items-center px-1"
          >
            About
          </Link>
          <Link
            to="/contact"
            className="text-muted-label hover:text-plum transition min-h-11 flex items-center px-1"
          >
            Contact
          </Link>
          <Link
            to="/support-us"
            className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-plum/20 bg-plum/5 hover:bg-plum/10 text-plum font-bold transition min-h-11"
          >
            <HiHeart className="w-4 h-4 text-plum shrink-0" />
            <span>Support Us</span>
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <main className="w-full max-w-6xl mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center py-4 sm:py-6">
        {/* Left Column: Hero, Framework & Phoneme Sample */}
        <div className="lg:col-span-7 flex order-1 flex-col space-y-5 sm:space-y-7">
          <div>
            <div className="flex items-center space-x-2 text-xs sm:text-base uppercase font-bold tracking-[0.2em] text-plum mb-2 sm:mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-plum inline-block"></span>
              <span>Linguistic Mastery Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-body-dark leading-tight mb-2 sm:mb-3 wrap-break-word">
              Imlaa<span className="text-plum">.</span>
            </h1>

            <div className="text-base sm:text-xl lg:text-2xl font-mono text-muted-label tracking-wide flex flex-wrap items-center gap-2 sm:space-x-3 mb-4 sm:mb-6">
              <span>/ˈɪm.lɑː/</span>
              <span className="text-plum/40 hidden sm:inline">•</span>
              <span className="text-body-dark font-sans font-medium text-sm sm:text-lg">
                Noun (Arabic: إملاء) —{" "}
                <span className="italic">Orthography & Dictation</span>
              </span>
            </div>

            <p className="text-base sm:text-lg lg:text-xl text-body-dark font-medium leading-relaxed max-w-2xl mb-2">
              High-frequency academic lexicon, phonetic transcription, and
              acoustic spelling dictation for IELTS candidates.
            </p>
          </div>

          {/* Interactive Pronunciation Banner */}
          <div className="imlaa-card p-4 sm:p-5 bg-plum/5 border border-plum/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                type="button"
                onClick={playPhonemeSample}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-plum hover:bg-plum-hover text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95 shrink-0"
                title="Listen to Christopher Neural pronunciation"
              >
                <HiVolumeUp
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${playingAudio ? "animate-pulse" : ""}`}
                />
              </button>
              <div>
                <div className="text-sm sm:text-base font-bold text-body-dark">
                  Listen to Native Phonetics
                </div>
                <div className="text-xs sm:text-sm text-muted-label">
                  Voice Synthesis via Microsoft Christopher Neural
                </div>
              </div>
            </div>

            {/* Audio Wave Graphic Simulation */}
            <div className="flex items-center space-x-1.5 self-end sm:self-center pr-2">
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-8 animate-pulse" : "h-4"}`}
              />
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-11" : "h-7"}`}
              />
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-6" : "h-3"}`}
              />
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-10" : "h-6"}`}
              />
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-7" : "h-4"}`}
              />
              <span
                className={`w-1.5 rounded-full bg-plum transition-all ${playingAudio ? "h-4" : "h-2"}`}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Supabase Authentication Widget */}
        <div className="lg:col-span-5 flex flex-col justify-center w-full">
          <div className="imlaa-card p-5 sm:p-8 border border-plum/20 shadow-md w-full">
            {/* Header: Sign In vs Create Account OR Forgot Password Header */}
            {authMode === "signin" || authMode === "signup" ? (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-2 border-b border-plum/15">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setErrorMessage("");
                      setInfoMessage("");
                      setIsGoogleAlert(false);
                    }}
                    className={`text-base sm:text-lg font-bold transition pb-1 cursor-pointer min-h-11 flex items-center ${
                      authMode === "signin"
                        ? "text-plum border-b-2 border-plum font-black"
                        : "text-muted-label hover:text-body-dark"
                    }`}
                  >
                    Sign In
                  </button>
                  <span className="text-plum/30">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setErrorMessage("");
                      setInfoMessage("");
                      setIsGoogleAlert(false);
                    }}
                    className={`text-base sm:text-lg font-bold transition pb-1 cursor-pointer min-h-11 flex items-center ${
                      authMode === "signup"
                        ? "text-plum border-b-2 border-plum font-black"
                        : "text-muted-label hover:text-body-dark"
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("forgot");
                    setErrorMessage("");
                    setInfoMessage("");
                    setIsGoogleAlert(false);
                  }}
                  className="text-xs font-bold text-plum hover:underline cursor-pointer bg-plum/5 hover:bg-plum/10 px-2.5 py-1.5 rounded-lg border border-plum/20 min-h-9 flex items-center"
                >
                  Forgot Password?
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-plum/15">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setErrorMessage("");
                    setInfoMessage("");
                    setIsGoogleAlert(false);
                  }}
                  className="inline-flex items-center space-x-1.5 text-sm font-bold text-plum hover:text-plum-hover cursor-pointer"
                >
                  <HiArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </button>

                <span className="text-xs font-bold text-muted-label uppercase tracking-wider">
                  {authMode === "otp"
                    ? "Email Verification (8-Digit)"
                    : authMode === "forgot"
                      ? "Password Recovery"
                      : "Reset Password (8-Digit)"}
                </span>
              </div>
            )}

            {/* Google OAuth (Primary 1-Click Button) */}
            {(authMode === "signin" || authMode === "signup") && (
              <div className="space-y-4 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className={`w-full py-3.5 px-4 rounded-xl border text-body-dark font-bold text-base flex items-center justify-center space-x-3 transition shadow-xs cursor-pointer active:scale-98 ${
                    isGoogleAlert
                      ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400 font-black animate-pulse"
                      : "border-plum/25 bg-white hover:bg-plum/5"
                  }`}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {googleLoading
                      ? "Connecting to Google..."
                      : "Continue with Google"}
                  </span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-plum/15" />
                  <span className="bg-white px-3 text-xs uppercase tracking-wider text-muted-label font-bold absolute">
                    or with email
                  </span>
                </div>
              </div>
            )}

            {/* Error & Info Messages */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-sm font-medium leading-relaxed animate-slide-up space-y-2">
                <div>{errorMessage}</div>
                {isGoogleAlert && (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="imlaa-btn-primary w-full py-2 text-xs font-bold"
                  >
                    Click to Sign In with Google
                  </button>
                )}
              </div>
            )}

            {infoMessage && (
              <div className="mb-4 p-3.5 rounded-xl border border-plum/30 bg-plum/5 text-plum text-sm font-medium leading-relaxed animate-slide-up">
                {infoMessage}
              </div>
            )}

            {/* Main Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (Sign Up Only) */}
              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-semibold text-body-dark mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Candidate Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="imlaa-input py-3 px-3.5 text-base"
                    required
                  />
                </div>
              )}

              {/* Email Address (Sign In, Sign Up, Forgot Password) */}
              {(authMode === "signin" ||
                authMode === "signup" ||
                authMode === "forgot") && (
                <div>
                  <label className="block text-sm font-semibold text-body-dark mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="candidate@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="imlaa-input py-3 pl-10 pr-3.5 text-base"
                      required
                    />
                    <HiEnvelope className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-label" />
                  </div>
                </div>
              )}

              {/* Password (Sign In & Sign Up) */}
              {(authMode === "signin" || authMode === "signup") && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-body-dark">
                      Password
                    </label>
                    {authMode === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("forgot");
                          setErrorMessage("");
                          setInfoMessage("");
                          setIsGoogleAlert(false);
                        }}
                        className="text-xs text-plum font-bold hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="imlaa-input py-3 pl-10 pr-3.5 text-base"
                      required
                    />
                    <HiKey className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-label" />
                  </div>

                  {/* Password Strength Indicator (Signup Mode) */}
                  {authMode === "signup" && password && (
                    <div className="mt-2 space-y-1 animate-slide-up">
                      <div className="h-1.5 w-full bg-plum/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-label">
                          Password strength:
                        </span>
                        <span className="font-semibold">{strength.label}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODE: Signup OTP Verification Code (8-Digit from Supabase) */}
              {authMode === "otp" && (
                <div className="space-y-4">
                  <div className="text-center p-3 rounded-xl bg-plum/5 border border-plum/15 space-y-1">
                    <p className="text-xs text-muted-label font-bold uppercase tracking-wider">
                      Verification code dispatched to:
                    </p>
                    <p className="font-mono text-plum font-black text-base">
                      {email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-body-dark mb-1.5 text-center">
                      Enter 8-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="• • • • • • • •"
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ""))
                      }
                      className="imlaa-input py-3.5 px-4 text-2xl font-mono tracking-widest text-center"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-plum/5 border border-plum/10 text-xs text-muted-label text-center">
                    Tip: You can also click the confirmation link in the email
                    to activate automatically.
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="text-muted-label hover:text-plum font-semibold cursor-pointer"
                    >
                      &larr; Change email address
                    </button>
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResendOtp}
                      className="text-plum font-bold hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <HiArrowPath
                        className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`}
                      />
                      <span>{resending ? "Resending..." : "Resend code"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MODE: Reset Password with 8-Digit OTP Code */}
              {authMode === "reset_password" && (
                <div className="space-y-4">
                  <div className="text-center p-3 rounded-xl bg-plum/5 border border-plum/15">
                    <p className="text-xs text-muted-label font-bold uppercase tracking-wider">
                      Recovery code sent to:
                    </p>
                    <p className="font-mono text-plum font-black text-base">
                      {email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-body-dark mb-1.5">
                      8-Digit Recovery Code
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="• • • • • • • •"
                      value={recoveryCode}
                      onChange={(e) =>
                        setRecoveryCode(
                          e.target.value.replace(/[^0-9a-zA-Z]/g, ""),
                        )
                      }
                      className="imlaa-input py-3 px-4 text-xl font-mono tracking-widest text-center"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-body-dark mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="imlaa-input py-3 pl-10 pr-3.5 text-base"
                        required
                      />
                      <HiKey className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-label" />
                    </div>

                    {newPassword && (
                      <div className="mt-2 space-y-1 animate-slide-up">
                        <div className="h-1.5 w-full bg-plum/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${resetStrength.color}`}
                            style={{ width: `${resetStrength.score}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-label">
                            Password strength:
                          </span>
                          <span className="font-semibold">
                            {resetStrength.label}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-body-dark mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="imlaa-input py-3 pl-10 pr-3.5 text-base"
                        required
                      />
                      <HiKey className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-label" />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={submitting}
                className="imlaa-btn-primary w-full py-3.5 text-base font-bold space-x-2 mt-2 shadow-xs cursor-pointer flex items-center justify-center"
              >
                <span>
                  {submitting
                    ? "Processing..."
                    : authMode === "signin"
                      ? "Sign In to Workspace"
                      : authMode === "signup"
                        ? "Create Free Account"
                        : authMode === "otp"
                          ? "Confirm Code & Enter"
                          : authMode === "forgot"
                            ? "Send Recovery Code"
                            : "Save New Password & Enter"}
                </span>
                <HiArrowRight className="w-5 h-5" />
              </button>

              {authMode === "signin" && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("forgot");
                      setErrorMessage("");
                      setInfoMessage("");
                      setIsGoogleAlert(false);
                    }}
                    className="text-sm text-muted-label hover:text-plum font-semibold transition cursor-pointer"
                  >
                    Forgot your password? Click here to reset it
                  </button>
                </div>
              )}
            </form>

            {/* Bottom Security Note */}
            <div className="mt-6 pt-4 border-t border-plum/15 flex items-center justify-center space-x-2 text-xs text-muted-label">
              <HiShieldCheck className="w-4 h-4 text-plum" />
              <span>Industry-standard encryption powered by Supabase Auth</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-plum/15 bg-white py-6 mt-12 text-muted-label text-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:space-x-3 text-center sm:text-left">
            <span className="font-black text-plum tracking-tight text-base">
              Imlaa
            </span>
            <span className="hidden sm:inline text-plum/30">•</span>
            <span>
              © {new Date().getFullYear()} Imlaa IELTS Workspace • Built with
              dedication for candidates worldwide.
            </span>
          </div>

          <div className="flex items-center space-x-6 text-body-dark font-medium">
            <Link to="/about" className="hover:text-plum transition">
              About
            </Link>
            <Link to="/contact" className="hover:text-plum transition">
              Contact
            </Link>
            <Link
              to="/support-us"
              className="text-plum font-bold hover:underline transition"
            >
              Support Us
            </Link>
          </div>

          <div className="flex items-center space-x-3 text-plum">
            <a
              href="https://linkedin.com/in/hasan-md-atik/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-plum/5 hover:bg-plum hover:text-white flex items-center justify-center transition"
            >
              <FaLinkedin className="w-4 h-4" />
            </a>
            <a
              href="https://github.com/akhasannaeem"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-plum/5 hover:bg-plum hover:text-white flex items-center justify-center transition"
            >
              <FaGithub className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
