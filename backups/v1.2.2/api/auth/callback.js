/**
 * TagSilo Pro - Google OAuth 2.0 Callback Handler
 * Exchanges authorization code for Access Token + Refresh Token (Server-Side).
 * Persists session in Supabase & redirects back to the client extension.
 */

const { supabase, isSupabaseConfigured } = require("../../lib/supabase");

const DEFAULT_CLIENT_ID = "1087305619025-un37jr32jn77k6ah4rjc0rlgqekbranf.apps.googleusercontent.com";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { code, state, error, error_description } = req.query || {};

  let stateData = {};
  try {
    if (state) {
      stateData = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    }
  } catch (e) {}

  const extensionRedirectTarget = stateData.redirect_to || "";

  if (error) {
    console.warn("[TagSilo Auth] OAuth consent denied:", error, error_description);
    if (extensionRedirectTarget) {
      const errUrl = new URL(extensionRedirectTarget);
      errUrl.searchParams.set("error", error);
      errUrl.searchParams.set("error_description", error_description || "Google authorization was cancelled");
      return res.redirect(302, errUrl.toString());
    }
    return res.status(400).send(`<h3>Authentication Cancelled</h3><p>${error_description || error}</p>`);
  }

  if (!code) {
    return res.status(400).send("<h3>Invalid Request</h3><p>No authorization code received from Google.</p>");
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "tagsilo.vercel.app";
    const callbackUrl = `${proto}://${host}/api/auth/callback`;

    // 1. Exchange Code for Access Token + Refresh Token via Google OAuth API
    const tokenParams = new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code"
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString()
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[TagSilo Auth] Token exchange error:", tokenData);
      const errMsg = tokenData.error_description || tokenData.error || "Token exchange failed";
      if (extensionRedirectTarget) {
        const errUrl = new URL(extensionRedirectTarget);
        errUrl.searchParams.set("error", "token_exchange_failed");
        errUrl.searchParams.set("error_description", errMsg);
        return res.redirect(302, errUrl.toString());
      }
      return res.status(400).send(`<h3>Authentication Error</h3><p>${errMsg}</p>`);
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || "";

    // 2. Fetch User Profile from Google API
    let userProfile = null;
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (userRes.ok) {
        userProfile = await userRes.json();
      }
    } catch (e) {
      console.warn("[TagSilo Auth] Profile fetch error:", e);
    }

    const userObj = {
      email: userProfile?.email || "Google Account Connected",
      name: userProfile?.name || "",
      picture: userProfile?.picture || "",
      lastAuth: new Date().toISOString()
    };

    // 3. Upsert User in Supabase Database (if configured)
    if (isSupabaseConfigured() && userObj.email && !userObj.email.includes("Account Connected")) {
      try {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, is_pro, license_tier")
          .eq("email", userObj.email.toLowerCase())
          .limit(1);

        const upsertPayload = {
          email: userObj.email.toLowerCase(),
          full_name: userObj.name || "",
          picture: userObj.picture || "",
          chrome_id: stateData.chrome_id || "",
          google_refresh_token: refreshToken || undefined,
          updated_at: new Date().toISOString()
        };

        if (existingUser && existingUser.length > 0) {
          await supabase.from("users").update(upsertPayload).eq("email", userObj.email.toLowerCase());
        } else {
          upsertPayload.is_pro = false;
          upsertPayload.license_tier = "free";
          await supabase.from("users").insert(upsertPayload);
        }
      } catch (dbErr) {
        console.warn("[TagSilo Auth] DB persistence note:", dbErr);
      }
    }

    // 4. Return Session to the Extension via redirect or success HTML bridge
    if (extensionRedirectTarget) {
      const targetUrl = new URL(extensionRedirectTarget);
      targetUrl.searchParams.set("token", accessToken);
      targetUrl.searchParams.set("user", encodeURIComponent(JSON.stringify(userObj)));
      if (refreshToken) targetUrl.searchParams.set("refresh_token", refreshToken);

      return res.redirect(302, targetUrl.toString());
    }

    // Bridge Landing Screen if opened in regular tab
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>TagSilo Pro - Google Account Connected</title>
        <style>
          body { background: #0A0E17; color: #E2E8F0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #151D2E; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; text-align: center; max-width: 380px; }
          h2 { color: #00F5D4; margin-top: 0; }
          p { color: #94A3B8; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>✓ Google Workspace Connected!</h2>
          <p>Logged in as <strong>${userObj.email}</strong>.</p>
          <p>You can now return to TagSilo Pro in your browser toolbar.</p>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("[TagSilo Auth] Callback server error:", err);
    return res.status(500).send(`<h3>Internal Server Error</h3><p>${err.message}</p>`);
  }
};
