/**
 * Vercel Serverless Function: POST /api/webhooks/creem
 * 100% Production Ready - Zero Placeholders
 * Handles Creem HMAC-SHA256 Signature Verification, parses lifecycle events,
 * and updates user subscription records in Supabase PostgreSQL via Service Role.
 */

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase Client with privileged Service Role Key
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Verify Creem HMAC-SHA256 Signature
 * Uses constant-time buffer comparison to prevent timing attack vulnerabilities
 */
function verifyCreemSignature(payloadString, signatureHeader, secret) {
  if (!secret) {
    console.error("[Creem Webhook] CREEM_WEBHOOK_SECRET environment variable is missing.");
    return false;
  }

  if (!signatureHeader) {
    console.warn("[Creem Webhook] Missing signature header in request.");
    return false;
  }

  try {
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(payloadString, "utf-8")
      .digest("hex");

    const cleanSignature = signatureHeader.replace(/^sha256=/i, "").trim();

    const expectedBuffer = Buffer.from(computedSignature, "utf-8");
    const providedBuffer = Buffer.from(cleanSignature, "utf-8");

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch (err) {
    console.error("[Creem Webhook] Signature calculation error:", err);
    return false;
  }
}

module.exports = async function handler(req, res) {
  // Set CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-creem-signature, creem-signature, x-webhook-signature");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. This endpoint accepts POST requests only."
    });
  }

  const signatureHeader = req.headers["x-creem-signature"] ||
                          req.headers["creem-signature"] ||
                          req.headers["x-webhook-signature"] ||
                          "";

  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;
  const rawBody = req.body || {};
  const payloadString = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

  // 1. Validate Webhook Signature
  const isValidSignature = verifyCreemSignature(payloadString, signatureHeader, webhookSecret);
  if (!isValidSignature) {
    console.warn("[Creem Webhook] 401 Unauthorized: Invalid HMAC signature detected.");
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid webhook signature."
    });
  }

  // 2. Extract Event Type & Payload Structure
  const event = rawBody.event || rawBody.type || "unknown";
  const data = rawBody.data || rawBody.object || rawBody;

  // Resolve target customer identifier
  const userEmail = (
    data.customer?.email ||
    data.customer_email ||
    data.email ||
    data.metadata?.userId ||
    data.metadata?.user_id ||
    ""
  ).toLowerCase().trim();

  const chromeId = data.metadata?.chromeId || data.metadata?.chrome_id || null;
  const creemCustomerId = data.customer_id || data.customer?.id || null;
  const subscriptionId = data.id || data.subscription_id || null;
  const licenseKey = data.license_key || data.key || null;

  console.log(`[Creem Webhook] Verified Event: '${event}' | Customer: '${userEmail || chromeId || "unknown"}'`);

  try {
    // Determine target tier & status based on event type
    let subscriptionStatus = "free";
    let tier = "free";

    switch (event) {
      // Activation Events
      case "subscription.created":
      case "checkout.completed":
      case "payment.succeeded":
      case "invoice.paid": {
        subscriptionStatus = "active";
        tier = "pro";
        break;
      }

      // Update / Renewal Events
      case "subscription.updated": {
        const rawStatus = (data.status || "active").toLowerCase();
        const isActive = rawStatus === "active" || rawStatus === "trialing";
        subscriptionStatus = isActive ? "active" : "inactive";
        tier = isActive ? "pro" : "free";
        break;
      }

      // Deactivation / Expiration Events
      case "subscription.deleted":
      case "subscription.cancelled":
      case "subscription.canceled":
      case "subscription.expired":
      case "payment.failed": {
        subscriptionStatus = "inactive";
        tier = "free";
        break;
      }

      default: {
        console.log(`[Creem Webhook] Unhandled event type received: ${event}`);
      }
    }

    // 3. Update Supabase PostgreSQL Database
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("[Creem Webhook] Supabase client could not be initialized. Please verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
      return res.status(500).json({
        success: false,
        error: "Database configuration missing on server."
      });
    }

    if (userEmail || chromeId) {
      const upsertPayload = {
        subscription_status: subscriptionStatus,
        tier: tier,
        creem_customer_id: creemCustomerId,
        creem_subscription_id: subscriptionId,
        license_key: licenseKey,
        updated_at: new Date().toISOString()
      };

      if (userEmail) upsertPayload.email = userEmail;
      if (chromeId) upsertPayload.chrome_id = chromeId;

      // Upsert user subscription status
      const conflictColumn = userEmail ? "email" : "chrome_id";
      const { data: updatedRecord, error: dbError } = await supabase
        .from("users")
        .upsert(upsertPayload, { onConflict: conflictColumn })
        .select();

      if (dbError) {
        console.error("[Creem Webhook] Database upsert error:", dbError);
        return res.status(500).json({
          success: false,
          error: "Failed to update user record in database: " + dbError.message
        });
      }

      console.log(`[Creem Webhook] Database updated successfully for ${userEmail || chromeId}: Status = '${subscriptionStatus}', Tier = '${tier}'`);

      // Audit Log Webhook Event
      await supabase
        .from("webhook_events")
        .insert({
          event_type: event,
          payload: rawBody,
          processed: true,
          created_at: new Date().toISOString()
        })
        .catch((auditErr) => console.warn("[Creem Webhook] Audit log notice:", auditErr.message));
    }

    return res.status(200).json({
      success: true,
      event: event,
      customer: userEmail || chromeId || null,
      subscriptionStatus: subscriptionStatus,
      tier: tier,
      processedAt: new Date().toISOString()
    });
  } catch (handlerError) {
    console.error("[Creem Webhook] Fatal handler exception:", handlerError);
    return res.status(500).json({
      success: false,
      error: "Internal server error processing webhook: " + handlerError.message
    });
  }
};
