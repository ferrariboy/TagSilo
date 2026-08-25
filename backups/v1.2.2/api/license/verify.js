/**
 * Vercel Serverless Function: POST /api/license/verify
 * Live Creem API License Validator & Supabase Subscription Verification
 * Dynamically targets https://test-api.creem.io or https://api.creem.io
 */

const { supabase, isSupabaseConfigured } = require("../../lib/supabase");

function getCreemApiHost(apiKey) {
  return (apiKey && apiKey.startsWith("creem_test_"))
    ? "https://test-api.creem.io"
    : "https://api.creem.io";
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ valid: false, error: "Method not allowed. Use POST." });
  }

  try {
    const { key, userId, licenseKey } = req.body || {};
    const testKey = (key || licenseKey || "").trim();
    const cleanUserId = (userId || "").toLowerCase().trim();
    const creemApiKey = process.env.CREEM_API_KEY || "creem_test_619RIT0qqrUUPM7HoSLK2a";
    const apiHost = getCreemApiHost(creemApiKey);

    if (!testKey && !cleanUserId) {
      return res.status(200).json({
        valid: false,
        tier: "free",
        status: "free",
        message: "No license key or user ID provided"
      });
    }

    // 1. Live Creem License API Verification
    if (testKey && creemApiKey && creemApiKey !== "PLACEHOLDER") {
      try {
        const creemRes = await fetch(`${apiHost}/v1/licenses/validate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": creemApiKey
          },
          body: JSON.stringify({ key: testKey })
        });

        if (creemRes.ok) {
          const creemData = await creemRes.json();
          console.log("[License Verify] Live Creem response:", creemData);

          const isStatusActive = !creemData.status || creemData.status === "active";
          const isExpired = creemData.expires_at && new Date(creemData.expires_at).getTime() < Date.now();

          if (isStatusActive && !isExpired) {
            return res.status(200).json({
              valid: true,
              tier: "pro",
              status: "active",
              key: testKey,
              expiresAt: creemData.expires_at || null,
              unlimited: true,
              source: "creem_api"
            });
          } else {
            return res.status(200).json({
              valid: false,
              tier: "free",
              status: isExpired ? "expired" : (creemData.status || "inactive"),
              message: isExpired ? "Subscription has expired." : "Subscription is inactive."
            });
          }
        } else {
          const errData = await creemRes.text();
          console.warn("[License Verify] Creem validation rejected key:", errData);
        }
      } catch (networkErr) {
        console.warn("[License Verify] Creem network note:", networkErr.message);
      }
    }

    // 2. Check Supabase Database
    if (isSupabaseConfigured() && (cleanUserId || testKey)) {
      try {
        let query = supabase.from("users").select("*");
        if (cleanUserId) {
          query = query.or(`email.eq.${cleanUserId},chrome_id.eq.${cleanUserId}`);
        } else {
          query = query.eq("license_key", testKey);
        }

        const { data: users, error } = await query.limit(1);

        if (!error && users && users.length > 0) {
          const user = users[0];
          const isExpired = user.current_period_end && new Date(user.current_period_end).getTime() < Date.now();
          const isActive = user.subscription_status === "active" && !isExpired;

          if (isActive) {
            return res.status(200).json({
              valid: true,
              tier: user.tier || "pro",
              status: "active",
              expiresAt: user.current_period_end || null,
              unlimited: true,
              source: "supabase_db"
            });
          } else if (isExpired || user.subscription_status === "canceled" || user.subscription_status === "past_due") {
            return res.status(200).json({
              valid: false,
              tier: "free",
              status: isExpired ? "expired" : user.subscription_status,
              message: "Subscription has ended or is no longer active."
            });
          }
        }
      } catch (dbErr) {
        console.warn("[License Verify] Supabase check notice:", dbErr.message);
      }
    }

    return res.status(200).json({
      valid: false,
      tier: "free",
      status: "invalid",
      message: "License key was not found or has expired."
    });
  } catch (err) {
    console.error("[Vercel License Verify] Error:", err);
    return res.status(500).json({
      valid: false,
      error: "Verification failure: " + err.message
    });
  }
};
