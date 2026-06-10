import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "[Config] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.\n" +
    "Add these environment variables in your Vercel project settings."
  );
}

export const supabase = createClient(
  url  ?? "https://placeholder.supabase.co",
  key  ?? "placeholder-key",
);
