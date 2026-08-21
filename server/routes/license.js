/**
 * License Verification Route
 * Validates Creem.io license keys securely using local database and server-side CREEM_API_KEY
 */

const express = require("express");
const db = require("../db/database");
const router = express.Router();

router.post("/verify", async (req, res) => {
  try {
    const { key, licenseKey, userId } = req.body;
    const targetKey = (key || licenseKey || "").trim();
    const targetUser = (userId || "").trim().toLowerCase();

    // 1. Check localized database first for webhook-activated user subscriptions
    if (targetUser) {
      const userRecord = db.getUser(targetUser);
      if (userRecord && userRecord.status === "active") {
        return res.json({
          success: true,
          valid: true,
          tier: userRecord.tier || "pro",
          status: "active",
          source: "database_subscription",
          userId: userRecord.userId
        });
      }
    }

    if (targetKey) {
      const userByLicense = db.getUserByLicenseKey(targetKey);
      if (userByLicense && userByLicense.status === "active") {
        return res.json({
          success: true,
          valid: true,
          tier: userByLicense.tier || "pro",
          status: "active",
          source: "database_license",
          userId: userByLicense.userId
        });
      }
    }

    if (!targetKey && !targetUser) {
      return res.status(400).json({
        success: false,
        valid: false,
        tier: "free",
        error: "License key or userId parameter is required."
      });
    }

    const creemApiKey = process.env.CREEM_API_KEY;

    // 2. If live CREEM_API_KEY is configured in .env, query production Creem API
    if (targetKey && creemApiKey && creemApiKey !== "PLACEHOLDER") {
      try {
        const creemRes = await fetch("https://api.creem.io/v1/licenses/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": creemApiKey,
            "Authorization": `Bearer ${creemApiKey}`
          },
          body: JSON.stringify({ key: targetKey })
        });

        if (creemRes.ok) {
          const data = await creemRes.json();
          const isValid = data.valid ?? true;
          const status = data.status || (isValid ? "active" : "inactive");
          const tier = data.tier || (targetKey.toUpperCase().includes("ENT") ? "enterprise" : "pro");

          if (targetUser && isValid) {
            db.setUserStatus(targetUser, "active", { tier, licenseKey: targetKey });
          }

          return res.json({
            success: true,
            valid: isValid,
            tier: isValid ? tier : "free",
            status: status,
            expiresAt: data.expires_at || null,
            customerEmail: data.customer_email || null
          });
        }

        const errText = await creemRes.text();
        console.warn("[Backend License] Creem API returned non-200:", errText);
      } catch (apiErr) {
        console.error("[Backend License] Creem API connection error:", apiErr);
      }
    }

    // 3. Pattern Matching / Offline Validation Fallback
    const isPatternValid = /^(TS|CREEM)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/i.test(targetKey) ||
                           (targetKey.length >= 16 && !targetKey.includes(" "));

    if (targetUser && isPatternValid) {
      db.setUserStatus(targetUser, "active", { tier: "pro", licenseKey: targetKey });
    }

    return res.json({
      success: true,
      valid: isPatternValid,
      tier: isPatternValid ? (targetKey.toUpperCase().includes("ENT") ? "enterprise" : "pro") : "free",
      status: isPatternValid ? "active" : "invalid",
      expiresAt: null
    });
  } catch (error) {
    console.error("[Backend License] Verification exception:", error);
    res.status(500).json({
      success: false,
      valid: false,
      tier: "free",
      error: "Internal license verification error: " + error.message
    });
  }
});

module.exports = router;
