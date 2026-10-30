import { supabase } from "../services/supabaseClient";
import { checkEmailAuthProvider } from "./authService";
import { telemetry } from "../services/telemetryService";

export function useSignIn({ setError, setUser, setRole, syncProfile }) {
  const signInWithGoogle = async () => {
    setError(null);
    try {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "http://localhost:5173";
      const { data, error: authErr } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/workspace/vocab`,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (authErr) throw authErr;
      return { success: true, data };
    } catch (err) {
      telemetry.trackAuthFailure("google_oauth_failed", { error: err.message });
      const msg = err.message || "Failed to initialize Google authentication.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const signInWithEmail = async (email, password) => {
    setError(null);
    const cleanEmail = String(email || "").trim().toLowerCase();
    const existing = await checkEmailAuthProvider(cleanEmail);
    if (existing?.auth_provider === "google") {
      const msg =
        "This email was registered using Google 1-Click Login. Please click 'Continue with Google' above to sign in.";
      setError(msg);
      return { success: false, isGoogleAccount: true, message: msg };
    }

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (authErr) {
        if (
          existing?.auth_provider === "google" ||
          authErr.message?.includes("Invalid login credentials")
        ) {
          if (existing?.auth_provider === "google") {
            const googleMsg =
              "This email was registered using Google 1-Click Login. Please click 'Continue with Google' above to sign in.";
            setError(googleMsg);
            return {
              success: false,
              isGoogleAccount: true,
              message: googleMsg,
            };
          }
        }
        throw authErr;
      }

      if (data?.user) {
        const profile = await syncProfile(data.user);
        setUser(profile);
        setRole(profile?.role || "general");
      }
      return { success: true, user: data.user };
    } catch (err) {
      telemetry.trackAuthFailure("credentials_rejected", {
        error: err.message,
        email: cleanEmail,
      });
      const msg = err.message || "Invalid email or password.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const signUpWithEmail = async (email, password, fullName) => {
    setError(null);
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(fullName || "").trim();
    const existing = await checkEmailAuthProvider(cleanEmail);
    if (existing) {
      if (existing.auth_provider === "google") {
        const msg =
          "This email is already registered using Google 1-Click Login. Please click 'Continue with Google' above to sign in.";
        setError(msg);
        return { success: false, isGoogleAccount: true, message: msg };
      }
      const msg =
        "An account with this email already exists. Please switch to 'Sign In' or click 'Forgot Password' if you lost access.";
      setError(msg);
      return { success: false, isEmailAccount: true, message: msg };
    }

    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: cleanName, name: cleanName } },
      });
      if (authErr) {
        const lowerMessage = authErr.message?.toLowerCase() || "";
        if (
          lowerMessage.includes("already registered") ||
          lowerMessage.includes("already exists")
        ) {
          const msg =
            "An account with this email already exists. Please switch to 'Sign In' or use 'Forgot Password'.";
          setError(msg);
          return { success: false, message: msg };
        }
        throw authErr;
      }

      if (
        data?.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        const msg =
          "An account with this email already exists. If you previously used Google, please sign in with 'Continue with Google'.";
        setError(msg);
        return { success: false, isGoogleAccount: true, message: msg };
      }

      const requiresOtp = !data.session && data.user;
      if (data.session?.user) {
        const profile = await syncProfile(data.session.user);
        setUser(profile);
        setRole(profile?.role || "general");
      }

      return {
        success: true,
        user: data.user,
        requiresOtp,
        message: requiresOtp
          ? "An 8-digit verification code was sent to your email. Please check your inbox and spam folder."
          : "Registration successful!",
      };
    } catch (err) {
      telemetry.trackAuthFailure("signup_rejected", {
        error: err.message,
        email: cleanEmail,
      });
      const msg = err.message || "Registration failed.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  return { signInWithGoogle, signInWithEmail, signUpWithEmail };
}
