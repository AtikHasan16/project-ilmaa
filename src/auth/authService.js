import { supabase } from "../services/supabaseClient";

export async function checkEmailAuthProvider(rawEmail) {
  const cleanEmail = String(rawEmail || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) return null;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, email, auth_provider")
      .eq("email", cleanEmail)
      .maybeSingle();
    return profile;
  } catch (error) {
    console.warn("Could not check email profile:", error);
    return null;
  }
}
