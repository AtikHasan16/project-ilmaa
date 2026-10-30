import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { getDeviceInfo } from "../utils/deviceInfo";
import { getCachedProfile, setCachedProfile } from "./profileStorage";

export function useSession() {
  const [user, setUser] = useState(() => getCachedProfile(null));
  const [role, setRole] = useState(() => getCachedProfile(null)?.role || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const resolvedName =
        (profile?.name && profile.name.trim()) ||
        (cached?.name && cached.name.trim()) ||
        fallbackName;
      const resolvedAvatar =
        profile?.avatar_url || cached?.avatarUrl || fallbackAvatar;
      const resolvedRole = profile?.role === "admin" ? "admin" : "general";
      const resolvedUser = {
        id: authUser.id,
        name: resolvedName,
        email: authUser.email,
        role: resolvedRole,
        avatarUrl: resolvedAvatar,
        authProvider:
          authUser.app_metadata?.provider || profile?.auth_provider || "email",
        createdAt: profile?.created_at || authUser.created_at || null,
        lastActiveAt:
          profile?.last_active_at ||
          authUser.last_sign_in_at ||
          new Date().toISOString(),
      };

      setCachedProfile(resolvedUser);
      const deviceInfo = getDeviceInfo();
      if (profile?.id) {
        supabase
          .from("profiles")
          .update({
            device_info: deviceInfo,
            last_active_at: new Date().toISOString(),
          })
          .eq("id", authUser.id)
          .then();
      } else {
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
        name:
          cached?.name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "Candidate",
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

  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await syncProfile(session.user);
        if (mounted) {
          setUser(profile);
          setRole(profile?.role || "general");
          setLoading(false);
        }
      } else if (mounted) {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [syncProfile]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const interval = setInterval(() => {
      supabase
        .from("profiles")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", user.id)
        .then();
    }, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return {
    user,
    role,
    loading,
    error,
    setUser,
    setRole,
    setError,
    syncProfile,
  };
}
