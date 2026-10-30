import { supabase } from "../services/supabaseClient";
import { checkEmailAuthProvider } from "./authService";

export function usePasswordReset({ setError, setUser, setRole, syncProfile }) {
  const sendPasswordResetEmail = async (rawEmail) => {
    setError(null);
    const cleanEmail = String(rawEmail || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      const msg = "Please enter a valid email address.";
      setError(msg);
      return { success: false, message: msg };
    }

    const existing = await checkEmailAuthProvider(cleanEmail);
    if (existing?.auth_provider === "google") {
      const msg =
        "This email was registered using Google 1-Click Login. There is no password to reset—simply click 'Continue with Google' to sign in.";
      setError(msg);
      return { success: false, isGoogleAccount: true, message: msg };
    }

    try {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "http://localhost:5173";
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        { redirectTo: `${origin}/reset-password` },
      );
      if (resetErr) throw resetErr;
      return {
        success: true,
        message:
          "Password recovery instructions and an 8-digit code have been dispatched to your email.",
      };
    } catch (err) {
      const msg = err.message || "Failed to dispatch password recovery email.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const resetPasswordWithOtp = async (rawEmail, rawToken, newPassword) => {
    setError(null);
    const cleanEmail = String(rawEmail || "").trim().toLowerCase();
    const cleanToken = String(rawToken || "")
      .replace(/[^0-9a-zA-Z]/g, "")
      .trim();
    if (!newPassword || newPassword.length < 6) {
      const msg = "New password must be at least 6 characters long.";
      setError(msg);
      return { success: false, message: msg };
    }

    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: "recovery",
      });
      if (otpError) throw otpError;

      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      if (data?.user) {
        const profile = await syncProfile(data.user);
        setUser(profile);
        setRole(profile?.role || "general");
      }
      return {
        success: true,
        message: "Password reset successfully! Redirecting to workspace...",
      };
    } catch (err) {
      const msg = err.message || "Invalid recovery code or password reset failed.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const updateUserPassword = async (newPassword) => {
    setError(null);
    if (!newPassword || newPassword.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setError(msg);
      return { success: false, message: msg };
    }

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      if (data?.user) {
        const profile = await syncProfile(data.user);
        setUser(profile);
        setRole(profile?.role || "general");
      }
      return { success: true, message: "Password updated successfully!" };
    } catch (err) {
      const msg = err.message || "Failed to update password.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  return {
    sendPasswordResetEmail,
    resetPasswordWithOtp,
    updateUserPassword,
  };
}
