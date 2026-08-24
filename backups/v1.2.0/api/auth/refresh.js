/**
 * TagSilo Pro - Google OAuth Token Silent Renewal
 * Uses stored refresh token to issue fresh access tokens silently.
 */

const { supabase, isSupabaseConfigured } = require("../../lib/supabase");

const DEFAULT_CLIENT_ID = "1087305619025-un37jr32jn77k6ah4rjc0rlgqekbranf.apps.googleusercontent.com";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const { email, refresh_token } = req.body || {};

    let resolvedRefreshToken = refresh_token;

    // If refresh token wasn't sent, query database for this user's stored refresh token
    if (!resolvedRefreshToken && email && isSupabaseConfigured()) {
      const { data: users } = await supabase
        .from("users")
        .select("google_refresh_token")
        .eq("email", email.toLowerCase().trim())
        .limit(1);

      if (users && users.length > 0) {
        resolvedRefreshToken = users[0].google_refresh_token;
      }
    }

    if (!resolvedRefreshToken) {
      return res.status(400).json({ success: false, error: "No refresh token available for this user session." });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: resolvedRefreshToken,
      grant_type: "refresh_token"
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString()
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return res.status(400).json({ success: false, error: tokenData.error_description || "Refresh failed." });
    }

    return res.status(200).json({
      success: true,
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in
    });
  } catch (err) {
    console.error("[TagSilo Auth] Refresh error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
