import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./authContextInstance";
import { supabase } from "../services/apiClient";
import { getDeviceInfo } from "../utils/deviceInfo";

export { useAuth } from "./useAuth";

const CACHE_PROFILE_KEY = "imlaa_user_profile";

function getCachedProfile(userId) {
  try {
    const raw = localStorage.getItem(CACHE_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (!userId || parsed.id === userId)) {
      return parsed;
    }
  } catch {
    // Ignore storage parse error
  }
  return null;
}

function setCachedProfile(profileData) {
  try {
    if (profileData) {
      localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(profileData));
    } else {
      localStorage.removeItem(CACHE_PROFILE_KEY);
    }
  } catch {
    // Ignore storage write error
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCachedProfile(null));
  const [role, setRole] = useState(() => {
    const cached = getCachedProfile(null);
    return cached?.role || null;
  }); // Strictly 'general' | 'admin'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to load or initialize profile from public.profiles
  const syncProfile = useCallback(async (authUser) => {
    if (!authUser) return null;

    try {
      const cached = getCachedProfile(authUser.id);

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileErr) {
        console.warn("Could not query public.profiles:", profileErr.message);
      }

      const fallbackName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split("@")[0] ||
        "Candidate";

      const fallbackAvatar =
        authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture ||
        null;

      // Persistence Priority:
      // 1. Database custom profile name
      // 2. Locally cached custom name
      // 3. Auth user metadata / email username
      const resolvedName =
        (profile?.name && profile.name.trim()) ||
        (cached?.name && cached.name.trim()) ||
        fallbackName;

      const resolvedAvatar =
        profile?.avatar_url ||
        cached?.avatarUrl ||
        fallbackAvatar;

      const resolvedRole = profile?.role === "admin" ? "admin" : "general";

      const resolvedUser = {
        id: authUser.id,
        name: resolvedName,
        email: authUser.email,
        role: resolvedRole,
        avatarUrl: resolvedAvatar,
        authProvider: authUser.app_metadata?.provider || profile?.auth_provider || "email",
        createdAt: profile?.created_at || authUser.created_at || null,
        lastActiveAt: profile?.last_active_at || authUser.last_sign_in_at || new Date().toISOString(),
      };

      // Persist to local storage immediately
      setCachedProfile(resolvedUser);

      // Heartbeat last_active_at and save device info asynchronously
      const deviceInfo = getDeviceInfo();
      if (profile?.id) {
        // Only update activity timestamp & device info — NEVER overwrite name or avatar on login!
        supabase
          .from("profiles")
          .update({
            device_info: deviceInfo,
            last_active_at: new Date().toISOString(),
          })
          .eq("id", authUser.id)
          .then();
      } else {
        // Initial insert if record does not yet exist
        supabase
          .from("profiles")
          .insert({
            id: authUser.id,
            name: resolvedName,
            email: resolvedUser.email,
            role: resolvedRole,
            avatar_url: resolvedAvatar,
            auth_provider: resolvedUser.authProvider,
            device_info: deviceInfo,
            created_at: resolvedUser.createdAt || new Date().toISOString(),
            last_active_at: new Date().toISOString(),
          })
          .then();
      }

      return resolvedUser;
    } catch (err) {
      console.warn("Profile sync error:", err);
      const cached = getCachedProfile(authUser.id);
      const fallbackUser = {
        id: authUser.id,
        name: cached?.name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Candidate",
        email: authUser.email,
        role: "general",
        avatarUrl: cached?.avatarUrl || null,
        authProvider: authUser.app_metadata?.provider || "email",
        createdAt: authUser.created_at || new Date().toISOString(),
        lastActiveAt: authUser.last_sign_in_at || null,
      };
      setCachedProfile(fallbackUser);
      return fallbackUser;
    }
  }, []);

  // Listen to Supabase Auth State changes
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const profile = await syncProfile(session.user);
          if (mounted) {
            setUser(profile);
            setRole(profile?.role || "general");
          }
        }
      } catch (err) {
        console.warn("Session restore failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await syncProfile(session.user);
        if (mounted) {
          setUser(profile);
          setRole(profile?.role || "general");
          setLoading(false);
        }
      } else {
        if (mounted) {
          setUser(null);
          setRole(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  // Periodic heartbeat while logged in (every 3 minutes)
  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      supabase
        .from("profiles")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", user.id)
        .then();
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Google OAuth 1-Click Sign-in
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
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (authErr) throw authErr;
      return { success: true, data };
    } catch (err) {
      const msg = err.message || "Failed to initialize Google authentication.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Helper to check if an email already belongs to a Google OAuth or Email account
  const checkEmailAuthProvider = async (rawEmail) => {
    const cleanEmail = String(rawEmail || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return null;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, email, auth_provider")
        .eq("email", cleanEmail)
        .maybeSingle();

      return profile;
    } catch (err) {
      console.warn("Could not check email profile:", err);
      return null;
    }
  };

  // Custom Email + Password Sign-in
  const signInWithEmail = async (email, password) => {
    setError(null);
    const cleanEmail = String(email || "").trim().toLowerCase();

    // Check if user account was created via Google
    const existing = await checkEmailAuthProvider(cleanEmail);
    if (existing?.auth_provider === "google") {
      const msg = "This email was registered using Google 1-Click Login. Please click 'Continue with Google' above to sign in.";
      setError(msg);
      return { success: false, isGoogleAccount: true, message: msg };
    }

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authErr) {
        // Double check if error was due to unlinked Google account
        if (existing?.auth_provider === "google" || authErr.message?.includes("Invalid login credentials")) {
          if (existing?.auth_provider === "google") {
            const googleMsg = "This email was registered using Google 1-Click Login. Please click 'Continue with Google' above to sign in.";
            setError(googleMsg);
            return { success: false, isGoogleAccount: true, message: googleMsg };
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
      const msg = err.message || "Invalid email or password.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Custom Registration with Email, Password & Full Name
  const signUpWithEmail = async (email, password, fullName) => {
    setError(null);
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(fullName || "").trim();

    // 1. Proactive Validation: Did candidate already register via Google?
    const existing = await checkEmailAuthProvider(cleanEmail);
    if (existing) {
      if (existing.auth_provider === "google") {
        const msg = "This email is already registered using Google 1-Click Login. Please click 'Continue with Google' above to sign in.";
        setError(msg);
        return { success: false, isGoogleAccount: true, message: msg };
      }
      const msg = "An account with this email already exists. Please switch to 'Sign In' or click 'Forgot Password' if you lost access.";
      setError(msg);
      return { success: false, isEmailAccount: true, message: msg };
    }

    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            name: cleanName,
          },
        },
      });

      if (authErr) {
        if (authErr.message?.toLowerCase().includes("already registered") || authErr.message?.toLowerCase().includes("already exists")) {
          const msg = "An account with this email already exists. Please switch to 'Sign In' or use 'Forgot Password'.";
          setError(msg);
          return { success: false, message: msg };
        }
        throw authErr;
      }

      // Check if Supabase silently prevented duplicate user (identities array empty)
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        const msg = "An account with this email already exists. If you previously used Google, please sign in with 'Continue with Google'.";
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
      const msg = err.message || "Registration failed.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Resend 8-Digit Email Verification Code
  const resendVerificationCode = async (email) => {
    setError(null);
    const cleanEmail = String(email || "").trim().toLowerCase();
    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: cleanEmail,
      });

      if (resendErr) {
        // Fallback to email_change type if signup resend fails
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
      const msg = err.message || "Failed to resend verification code. Please wait a moment and try again.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Verify 4-digit, 6-digit, or 8-digit Email OTP Token
  const verifyEmailOtp = async (email, token) => {
    setError(null);
    try {
      const cleanEmail = String(email || "").trim().toLowerCase();
      // Strip all non-alphanumeric characters (spaces, dashes, dots)
      const cleanToken = String(token || "").replace(/[^0-9a-zA-Z]/g, "").trim();

      if (!cleanToken || cleanToken.length < 4) {
        throw new Error("Please enter a valid verification code.");
      }

      // Try 1: 'signup' verification type
      let { data, error: authErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: "signup",
      });

      // Try 2: 'email' magic link/OTP type
      if (authErr) {
        const { data: fbData, error: fbErr } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: "email",
        });
        if (!fbErr && fbData?.user) {
          data = fbData;
          authErr = null;
        }
      }

      // Try 3: 'recovery' type in case code was sent via recovery flow
      if (authErr) {
        const { data: recData, error: recErr } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: "recovery",
        });
        if (!recErr && recData?.user) {
          data = recData;
          authErr = null;
        }
      }

      if (authErr) {
        throw authErr;
      }

      if (data?.user) {
        const profile = await syncProfile(data.user);
        setUser(profile);
        setRole(profile?.role || "general");
      }

      return { success: true, user: data?.user };
    } catch (err) {
      const msg = err.message || "Invalid or expired verification code. Please request a new code.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Send Password Recovery Email
  const sendPasswordResetEmail = async (rawEmail) => {
    setError(null);
    const cleanEmail = String(rawEmail || "").trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      const msg = "Please enter a valid email address.";
      setError(msg);
      return { success: false, message: msg };
    }

    // Check if account is a Google account
    const existing = await checkEmailAuthProvider(cleanEmail);
    if (existing?.auth_provider === "google") {
      const msg = "This email was registered using Google 1-Click Login. There is no password to reset—simply click 'Continue with Google' to sign in.";
      setError(msg);
      return { success: false, isGoogleAccount: true, message: msg };
    }

    try {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "http://localhost:5173";

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/reset-password`,
      });

      if (resetErr) throw resetErr;

      return {
        success: true,
        message: "Password recovery instructions and an 8-digit code have been dispatched to your email.",
      };
    } catch (err) {
      const msg = err.message || "Failed to dispatch password recovery email.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Verify Recovery OTP Code and Set New Password
  const resetPasswordWithOtp = async (rawEmail, rawToken, newPassword) => {
    setError(null);
    const cleanEmail = String(rawEmail || "").trim().toLowerCase();
    const cleanToken = String(rawToken || "").replace(/[^0-9a-zA-Z]/g, "").trim();

    if (!newPassword || newPassword.length < 6) {
      const msg = "New password must be at least 6 characters long.";
      setError(msg);
      return { success: false, message: msg };
    }

    try {
      // Step 1: Verify the recovery OTP token
      const { error: otpErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: "recovery",
      });

      if (otpErr) throw otpErr;

      // Step 2: Update password on active session
      const { data: userUpdate, error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) throw updateErr;

      if (userUpdate?.user) {
        const profile = await syncProfile(userUpdate.user);
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

  // Update Profile Credentials (Name & Avatar URL) with Persistent Storage
  const updateProfile = async ({ name, avatarUrl }) => {
    setError(null);
    if (!user?.id) return { success: false, message: "No active user session" };

    try {
      const updates = {};
      if (name) updates.name = name.trim();
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
      updates.last_active_at = new Date().toISOString();

      // 1. Update public.profiles in Supabase database
      const { data, error: updateErr } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // 2. Also update Supabase Auth user metadata so session token carries the new credentials
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: updates.name || user.name,
            name: updates.name || user.name,
            avatar_url: updates.avatar_url !== undefined ? updates.avatar_url : user.avatarUrl,
            picture: updates.avatar_url !== undefined ? updates.avatar_url : user.avatarUrl,
          },
        });
      } catch (authMetaErr) {
        console.warn("Could not sync auth metadata:", authMetaErr);
      }

      const updatedUser = {
        ...user,
        name: updates.name || user.name,
        avatarUrl: updates.avatar_url !== undefined ? updates.avatar_url : user.avatarUrl,
        lastActiveAt: updates.last_active_at,
      };

      // 3. Persist to localStorage for permanent consistency
      setCachedProfile(updatedUser);

      // 4. Update current user state in React
      setUser(updatedUser);

      // 5. Record activity in audit_logs
      try {
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "PROFILE_UPDATE",
          user_name: updates.name || user.name,
          access_id: user.id,
          details: `Candidate updated profile credentials: ${updates.name ? `name changed to "${updates.name}"` : ""} ${updates.avatar_url !== undefined ? "(photo updated)" : ""}`.trim(),
          timestamp: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn("Could not insert profile update audit log:", logErr);
      }

      return { success: true, profile: data };
    } catch (err) {
      console.error("Profile update error:", err);
      const msg = err.message || "Failed to update profile credentials.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Update Password directly (for users arriving via email recovery link)
  const updateUserPassword = async (newPassword) => {
    setError(null);
    if (!newPassword || newPassword.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setError(msg);
      return { success: false, message: msg };
    }

    try {
      const { data, error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) throw updateErr;

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

  // Sign out / Logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase sign out error:", err);
    } finally {
      setCachedProfile(null);
      setUser(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        verifyEmailOtp,
        resendVerificationCode,
        sendPasswordResetEmail,
        resetPasswordWithOtp,
        updateUserPassword,
        updateProfile,
        checkEmailAuthProvider,
        signOut,
        logout: signOut,
        isAuthenticated: Boolean(user),
        isAdmin: role === "admin",
        isAdvance: false,
        isAdvanceOrAdmin: role === "admin",
        isGeneral: role !== "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
