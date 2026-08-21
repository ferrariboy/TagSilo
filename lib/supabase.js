/**
 * Supabase Admin Client Initializer
 * Connects to Supabase PostgreSQL using SUPABASE_SERVICE_ROLE_KEY
 * Gracefully handles missing/invalid credentials without crashing serverless routes
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

let supabase = null;

if (supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("https://") && !supabaseUrl.includes("supabase.co/")) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  } catch (err) {
    console.warn("[Supabase] Client init exception:", err.message);
  }
}

module.exports = {
  supabase,
  isSupabaseConfigured: () => !!(supabaseUrl && supabaseServiceKey && supabase && supabaseUrl !== "https://supabase.co")
};
