import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { HiKey, HiArrowRight, HiCheckCircle } from "react-icons/hi2";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { updateUserPassword } = useAuth();
  const navigate = useNavigate();

  // Password strength meter
  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "bg-plum/20" };
    let score = 0;
    if (pass.length >= 6) score += 25;
    if (pass.length >= 8) score += 25;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 25;
    if (/\d/.test(pass)) score += 25;
    if (score <= 25) return { score: 25, label: "Weak", color: "bg-rose-500 text-rose-600" };
    if (score <= 50) return { score: 50, label: "Fair", color: "bg-amber-500 text-amber-600" };
    if (score <= 75) return { score: 75, label: "Good", color: "bg-blue-500 text-blue-600" };
    return { score: 100, label: "Strong", color: "bg-emerald-500 text-emerald-600" };
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await updateUserPassword(newPassword);
      if (res.success) {
        setSuccessMessage("Password successfully updated! Redirecting to workspace...");
        setTimeout(() => {
          navigate("/workspace/flashcard");
        }, 1200);
      } else {
        setErrorMessage(res.message || "Failed to update password.");
      }
    } catch (err) {
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white text-body-dark flex flex-col justify-between px-4 sm:px-8 py-8">
      {/* Top Brand Header */}
      <header className="w-full max-w-xl mx-auto flex items-center justify-between pb-6">
        <Link to="/" className="font-black text-2xl tracking-tight text-body-dark">
          Imlaa<span className="text-plum">.</span>
        </Link>
        <Link to="/" className="text-sm font-semibold text-muted-label hover:text-plum transition">
          Back to Home
        </Link>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-md mx-auto my-auto">
        <div className="imlaa-card p-6 sm:p-8 border border-plum/20 shadow-lg bg-white space-y-6">
          <div className="text-center space-y-1 pb-2 border-b border-plum/15">
            <h1 className="text-2xl font-black text-body-dark">
              Set New Password
            </h1>
            <p className="text-sm text-muted-label">
              Please enter your new security password below.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 text-sm font-medium animate-slide-up">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-medium flex items-center space-x-2 animate-slide-up">
              <HiCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoFocus
                />
                <HiKey className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-label" />
              </div>

              {newPassword && (
                <div className="mt-2 space-y-1 animate-slide-up">
                  <div className="h-1.5 w-full bg-plum/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-label">Password strength:</span>
                    <span className="font-semibold">{strength.label}</span>
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

            <button
              type="submit"
              disabled={submitting}
              className="imlaa-btn-primary w-full py-3.5 text-base font-bold flex items-center justify-center space-x-2 mt-4"
            >
              <span>{submitting ? "Updating Password..." : "Save New Password"}</span>
              <HiArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>

      <footer className="w-full text-center text-xs text-muted-label pt-6">
        Protected by Supabase Cryptographic Session Security
      </footer>
    </div>
  );
}
