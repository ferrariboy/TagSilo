/**
 * TagSilo Pro - Google OAuth 2.0 Initiation Proxy
 * Initiates secure Authorization Code Flow with offline access for refresh tokens.
 */

const DEFAULT_CLIENT_ID = "1087305619025-un37jr32jn77k6ah4rjc0rlgqekbranf.apps.googleusercontent.com";
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile"
].join(" ");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { redirect_to, chrome_id, prompt } = req.query || {};

    const clientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;

    // Detect server host for dynamic callback resolution
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || "tagsilo.vercel.app";
    const callbackUrl = `${proto}://${host}/api/auth/callback`;

    // Encode state containing extension callback target and metadata
    const stateObj = {
      redirect_to: redirect_to || "",
      chrome_id: chrome_id || "",
      created: Date.now()
    };
    const stateStr = Buffer.from(JSON.stringify(stateObj)).toString("base64url");

    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: SCOPES,
      access_type: "offline",
      prompt: prompt || "consent select_account",
      include_granted_scopes: "true",
      state: stateStr
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;

    // If request accepts JSON or wants URL string
    if (req.query.json === "true") {
      return res.status(200).json({ success: true, authUrl: googleAuthUrl, callbackUrl });
    }

    return res.redirect(302, googleAuthUrl);
  } catch (err) {
    console.error("[TagSilo Auth] Google OAuth Init Error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
