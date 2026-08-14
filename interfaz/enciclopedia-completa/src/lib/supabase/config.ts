const FALLBACK_URL = "https://rmotrwigxlrgsogcznbz.supabase.co";
const FALLBACK_PUBLISHABLE_KEY = "sb_publishable_rkIz4J2uzYH2zJX9Y1i0hg_nsEdVT8n";

export const supabaseConfig = {
  url: (process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL).replace(/\/$/, ""),
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || FALLBACK_PUBLISHABLE_KEY,
};
