/**
 * Creem Webhook Handler Route (Unauthenticated Public Webhook Endpoint)
 * Route: POST /api/webhooks/creem
 * Validates HMAC signatures using CREEM_WEBHOOK_SECRET
 * Handles: subscription.created, subscription.updated, and subscription.deleted
 * Updates localized JSON database with active/inactive statuses.
 */

const express = require("express");
const crypto = require("crypto");
const db = require("../db/database");

const router = express.Router();

/**
 * Verify Creem HMAC-SHA256 Signature
 */
function verifyCreemWebhookSignature(rawPayload, signatureHeader, secret) {
  if (!secret || secret === "PLACEHOLDER") {
    console.warn("[Creem Webhook] CREEM_WEBHOOK_SECRET is set to PLACEHOLDER. Allowing in development mode.");
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  try {
    const payloadStr = typeof rawPayload === "string" ? rawPayload : JSON.stringify(rawPayload);
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadStr, "utf-8")
      .digest("hex");

    const cleanSignature = signatureHeader.replace(/^sha256=/i, "").trim();

    // Constant-time buffer comparison to prevent timing attacks
    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const signatureBuf = Buffer.from(cleanSignature, "utf-8");

    if (expectedBuf.length !== signatureBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, signatureBuf);
  } catch (err) {
    console.error("[Creem Webhook] Signature verification exception:", err);
    return false;
  }
}

/**
 * Main Webhook Listener (Unauthenticated)
 * Mounted at: /api/webhooks/creem and /api/webhook/creem
 */
router.post("/creem", async (req, res) => {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  const signatureHeader = req.headers["x-creem-signature"] ||
                          req.headers["creem-signature"] ||
                          req.headers["x-webhook-signature"] ||
                          "";

  const rawBody = req.body;

  // 1. Signature Verification
  const isVerified = verifyCreemWebhookSignature(rawBody, signatureHeader, secret);
  if (!isVerified) {
    console.warn("[Creem Webhook] 401 Unauthorized: Invalid HMAC signature.");
    return res.status(401).json({
      success: false,
      error: "Invalid webhook signature."
    });
  }

  // 2. Extract Event & Payload Objects
  const event = req.body.event || req.body.type || "unknown";
  const payloadData = req.body.data || req.body.object || req.body;

  // Resolve target userId
  const userId = payloadData.metadata?.userId ||
                 payloadData.metadata?.user_id ||
                 payloadData.customer?.metadata?.user_id ||
                 payloadData.customer?.metadata?.userId ||
                 payloadData.customer?.email ||
                 payloadData.customer_email ||
                 payloadData.email ||
                 null;

  const subscriptionId = payloadData.id || payloadData.subscription_id || null;
  const licenseKey = payloadData.license_key || payloadData.key || null;

  console.log(`[Creem Webhook] Received Event: '${event}' for User: '${userId || "unknown"}'`);

  // Audit log to local database
  db.logWebhook(event, req.body, isVerified);

  try {
    switch (event) {
      // 1. subscription.created -> Activate Pro Status
      case "subscription.created":
      case "checkout.completed":
      case "payment.succeeded": {
        if (userId) {
          db.setUserStatus(userId, "active", {
            tier: "pro",
            subscriptionId,
            licenseKey,
            customerEmail: payloadData.customer?.email || payloadData.customer_email || userId,
            plan: payloadData.plan || payloadData.price_id || "pro_monthly",
            activatedAt: new Date().toISOString()
          });
        }
        break;
      }

      // 2. subscription.updated -> Evaluate Active vs Inactive state
      case "subscription.updated": {
        if (userId) {
          const rawStatus = (payloadData.status || "active").toLowerCase();
          const isActive = rawStatus === "active" || rawStatus === "trialing";
          const newStatus = isActive ? "active" : "inactive";

          db.setUserStatus(userId, newStatus, {
            tier: isActive ? "pro" : "free",
            subscriptionId,
            licenseKey,
            subscriptionStatus: rawStatus,
            plan: payloadData.plan || payloadData.price_id || "pro_monthly"
          });
        }
        break;
      }

      // 3. subscription.deleted -> Deactivate and return to Free tier
      case "subscription.deleted":
      case "subscription.cancelled":
      case "subscription.canceled":
      case "subscription.expired": {
        if (userId) {
          db.setUserStatus(userId, "inactive", {
            tier: "free",
            subscriptionId,
            licenseKey,
            cancelledAt: new Date().toISOString()
          });
        }
        break;
      }

      default:
        console.log(`[Creem Webhook] Unhandled event type: ${event}`);
    }

    return res.status(200).json({
      received: true,
      event,
      userId: userId || null,
      processed: true
    });
  } catch (err) {
    console.error("[Creem Webhook] Error processing event:", err);
    return res.status(500).json({
      received: true,
      error: "Internal error updating subscription state: " + err.message
    });
  }
});

module.exports = router;
