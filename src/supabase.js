import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: log env var presence (never log actual key value)
console.log("[Supabase] URL:", url ?? "MISSING");
console.log("[Supabase] Key present:", !!key, key ? `(starts with: ${key.slice(0, 12)}...)` : "MISSING");

if (!url || !key) {
  console.error(
    "[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. " +
    "Set these in Vercel project settings and redeploy."
  );
}

export const supabase = createClient(
  url  ?? "https://placeholder.supabase.co",
  key  ?? "placeholder-key",
);
