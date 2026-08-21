/**
 * Creem Checkout Route
 * Generates secure checkout sessions via the Creem API (https://api.creem.io/v1/checkouts)
 * Uses private CREEM_API_KEY from process.env
 */

const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, priceId, userEmail, successUrl, cancelUrl, metadata } = req.body;

    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: "Missing required 'priceId' parameter for checkout session."
      });
    }

    const creemApiKey = process.env.CREEM_API_KEY;

    // 1. If live CREEM_API_KEY is configured in .env, call the production Creem API
    if (creemApiKey && creemApiKey !== "PLACEHOLDER") {
      try {
        const payload = {
          price_id: priceId,
          success_url: successUrl || "https://creem.io/checkout/success",
          cancel_url: cancelUrl || "https://creem.io/checkout/cancel",
          metadata: {
            userId: userId || "anonymous",
            source: "tagsilo_chrome_extension",
            ...(metadata || {})
          }
        };

        if (userEmail) {
          payload.customer = { email: userEmail };
        }

        const creemResponse = await fetch("https://api.creem.io/v1/checkouts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": creemApiKey,
            "Authorization": `Bearer ${creemApiKey}`
          },
          body: JSON.stringify(payload)
        });

        if (creemResponse.ok) {
          const checkoutData = await creemResponse.json();
          const checkoutUrl = checkoutData.checkout_url || checkoutData.url || (checkoutData.id ? `https://creem.io/checkout/${checkoutData.id}` : null);

          if (checkoutUrl) {
            return res.status(200).json({
              success: true,
              checkoutUrl: checkoutUrl,
              id: checkoutData.id || null,
              mode: "production"
            });
          }
        }

        const errorText = await creemResponse.text();
        console.warn("[Backend Checkout] Creem API returned non-200 status:", errorText);
        
        let parsedErr = "";
        try {
          const errObj = JSON.parse(errorText);
          parsedErr = errObj.message || errObj.error || errorText;
        } catch (e) {
          parsedErr = errorText;
        }

        return res.status(creemResponse.status).json({
          success: false,
          error: `Creem Checkout API Error: ${parsedErr}`,
          fallbackUrl: `https://creem.io/checkout/${encodeURIComponent(priceId)}?user_id=${encodeURIComponent(userId || "")}`
        });
      } catch (networkError) {
        console.error("[Backend Checkout] Network error calling Creem API:", networkError);
        return res.status(502).json({
          success: false,
          error: `Network error connecting to Creem API: ${networkError.message}`,
          fallbackUrl: `https://creem.io/checkout/${encodeURIComponent(priceId)}?user_id=${encodeURIComponent(userId || "")}`
        });
      }
    }

    // 2. Development / Placeholder Fallback Mode
    console.log(`[Backend Checkout] Generating development checkout session for userId: ${userId || 'anonymous'}, priceId: ${priceId}`);
    const devCheckoutUrl = `https://creem.io/checkout/${encodeURIComponent(priceId)}?user_id=${encodeURIComponent(userId || "anonymous")}&source=tagsilo_pro`;

    return res.status(200).json({
      success: true,
      checkoutUrl: devCheckoutUrl,
      mode: "development_fallback",
      message: "Development checkout link generated (configure CREEM_API_KEY in .env for live API sessions)."
    });
  } catch (err) {
    console.error("[Backend Checkout] Unexpected server error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal checkout server error: " + err.message
    });
  }
});

module.exports = router;
