import { createClient } from "@supabase/supabase-js";

const envProcess =
  typeof globalThis !== "undefined" && globalThis.process
    ? globalThis.process.env
    : null;
const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  envProcess?.VITE_SUPABASE_URL ||
  "https://evjvqrxrevycnjxsnjdt.supabase.co";
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  envProcess?.VITE_SUPABASE_ANON_KEY ||
  "placeholder-anon-key-for-local-testing";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
