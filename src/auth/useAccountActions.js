import { supabase } from "../services/supabaseClient";
import { toCamel } from "../services/dataMappers";
import { recordAuditLog } from "../services/auditService";
import { setCachedProfile } from "./profileStorage";

export function useAccountActions({ user, setUser, setRole, setError }) {
  const updateProfile = async ({ name, avatarUrl }) => {
    setError(null);
    if (!user?.id) {
      return { success: false, message: "No active user session" };
    }

    try {
      const updates = {};
      if (name) updates.name = name.trim();
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
      updates.last_active_at = new Date().toISOString();

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();
      if (updateError) throw updateError;

      try {
        await supabase.auth.updateUser({
          data: {
            full_name: updates.name || user.name,
            name: updates.name || user.name,
            avatar_url:
              updates.avatar_url !== undefined
                ? updates.avatar_url
                : user.avatarUrl,
            picture:
              updates.avatar_url !== undefined
                ? updates.avatar_url
                : user.avatarUrl,
          },
        });
      } catch (authMetaError) {
        console.warn("Could not sync auth metadata:", authMetaError);
      }

      const updatedUser = {
        ...user,
        name: updates.name || user.name,
        avatarUrl:
          updates.avatar_url !== undefined
            ? updates.avatar_url
            : user.avatarUrl,
        lastActiveAt: updates.last_active_at,
      };
      setCachedProfile(updatedUser);
      setUser(updatedUser);

      try {
        await recordAuditLog({
          userId: user.id,
          userName: updates.name || user.name,
          action: "PROFILE_UPDATE",
          details: `Candidate updated profile credentials: ${updates.name ? `name changed to "${updates.name}"` : ""} ${updates.avatar_url !== undefined ? "(photo updated)" : ""}`.trim(),
          timestamp: new Date().toISOString(),
        });
      } catch (logError) {
        console.warn("Could not insert profile update audit log:", logError);
      }

      return { success: true, profile: toCamel(data) };
    } catch (err) {
      console.error("Profile update error:", err);
      const msg = err.message || "Failed to update profile credentials.";
      setError(msg);
      return { success: false, message: msg };
    }
  };

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

  return { updateProfile, signOut };
}
