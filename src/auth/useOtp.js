import { supabase } from "../services/supabaseClient";
import { telemetry } from "../services/telemetryService";

export function useOtp({ setError, setUser, setRole, syncProfile }) {
  const resendVerificationCode = async (email) => {
    setError(null);
    const cleanEmail = String(email || "").trim().toLowerCase();
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
      });
      if (resendErr) {
        const { error: fallbackErr } = await supabase.auth.resend({
          type: "email_change",
          email: cleanEmail,
        });
        if (fallbackErr) throw fallbackErr;
      }
      return {
        success: true,
        message: "A fresh 8-digit verification code has been dispatched to your email.",
      };
    } catch (err) {
      telemetry.trackOtpFailure("resend_failed", { error: err.message, email: cleanEmail });
      const msg =
        err.message ||
        "Failed to resend verification code. Please wait a moment and try again.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const verifyEmailOtp = async (email, token) => {
    setError(null);
    const cleanEmail = String(email || "").trim().toLowerCase();
    try {
      const cleanToken = String(token || "")
        .replace(/[^0-9a-zA-Z]/g, "")
        .trim();
      if (!cleanToken || cleanToken.length < 4) {
        throw new Error("Please enter a valid verification code.");
      }

      let { data, error: authErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: "signup",
      });
      if (authErr) {
        const { data: fallbackData, error: fallbackError } =
          await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: "email",
          });
        if (!fallbackError && fallbackData?.user) {
          data = fallbackData;
          authErr = null;
        }
      }
      if (authErr) {
        const { data: recoveryData, error: recoveryError } =
          await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: "recovery",
          });
        if (!recoveryError && recoveryData?.user) {
          data = recoveryData;
          authErr = null;
        }
      }
      if (authErr) throw authErr;

      if (data?.user) {
        const profile = await syncProfile(data.user);
        setUser(profile);
        setRole(profile?.role || "general");
      }
      return { success: true, user: data?.user };
    } catch (err) {
      telemetry.trackOtpFailure("verification_failed", { error: err.message, email: cleanEmail });
      const msg =
        err.message ||
        "Invalid or expired verification code. Please request a new code.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  return { resendVerificationCode, verifyEmailOtp };
}
