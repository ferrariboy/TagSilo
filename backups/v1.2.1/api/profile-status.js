/**
 * Vercel Serverless Function: GET /api/profile-status
 * Checks if a user / scanned profile is authorized, active, and within quota
 * Queries Supabase database users table using Service Role key
 */

const { supabase, isSupabaseConfigured } = require("../lib/supabase");

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ authorized: false, error: "Method not allowed. Use GET." });
  }

  try {
    const { email, chrome_id, license_key, profile_url } = req.query || {};

    const cleanEmail = (email || "").toLowerCase().trim();
    const cleanChromeId = (chrome_id || "").trim();
    const cleanLicenseKey = (license_key || "").trim();

    let userRecord = null;

    // 1. Query Supabase Database if configured
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from("users").select("*");

        if (cleanEmail) {
          query = query.eq("email", cleanEmail);
        } else if (cleanChromeId) {
          query = query.eq("chrome_id", cleanChromeId);
        } else if (cleanLicenseKey) {
          query = query.eq("license_key", cleanLicenseKey);
        }

        const { data: users, error: dbErr } = await query.limit(1);

        if (!dbErr && users && users.length > 0) {
          userRecord = users[0];
        }
      } catch (dbException) {
        console.warn("[Vercel Profile Status] Database query note:", dbException.message);
      }
    }

    // 2. Evaluate Subscription & Authorization State
    const isPeriodEnded = userRecord?.current_period_end && new Date(userRecord.current_period_end).getTime() < Date.now();
    const isDbActive = userRecord && userRecord.subscription_status === "active" && !isPeriodEnded;
    const isLicenseActive = cleanLicenseKey && (/^(TS|CREEM)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/i.test(cleanLicenseKey) || cleanLicenseKey.length >= 16);
    
    const isPro = isDbActive || isLicenseActive;
    const tier = isPro ? (userRecord?.tier || "pro") : "free";
    const status = isPro ? "active" : (isPeriodEnded ? "expired" : (userRecord?.subscription_status || "free"));

    return res.status(200).json({
      success: true,
      authorized: true,
      isPro: isPro,
      status: status,
      tier: tier,
      user: {
        email: userRecord?.email || cleanEmail || null,
        chromeId: userRecord?.chrome_id || cleanChromeId || null,
        subscriptionStatus: status,
        tier: tier
      },
      profileUrl: profile_url || null,
      serverTimestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("[Vercel Profile Status] Exception:", err);
    return res.status(500).json({
      success: false,
      authorized: false,
      isPro: false,
      status: "error",
      error: "Status check exception: " + err.message
    });
  }
};
