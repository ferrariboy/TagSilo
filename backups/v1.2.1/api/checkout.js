/**
 * Vercel Serverless Function: POST /api/checkout
 * Generates secure checkout sessions via Creem API
 * Supports Creem Test Mode (https://test-api.creem.io) & Live Mode (https://api.creem.io)
 */

function getCreemApiHost(apiKey) {
  return (apiKey && apiKey.startsWith("creem_test_"))
    ? "https://test-api.creem.io"
    : "https://api.creem.io";
}

const DEFAULT_TEST_PAYMENT_URL = "https://www.creem.io/test/product/prod_2UzZ3KgIogYrqFFCZ4N9SP";

module.exports = async (req, res) => {
  // CORS Preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const { userId, productId, priceId, chromeId, userEmail, discountCode, successUrl, cancelUrl, metadata } = req.body || {};

    const creemApiKey = process.env.CREEM_API_KEY || "creem_test_619RIT0qqrUUPM7HoSLK2a";
    const targetProductId = productId || process.env.CREEM_PRODUCT_ID || "prod_2UzZ3KgIogYrqFFCZ4N9SP";
    const apiHost = getCreemApiHost(creemApiKey);
    const directCheckoutUrl = process.env.CREEM_CHECKOUT_URL || DEFAULT_TEST_PAYMENT_URL;

    // 1. Live Creem API Checkout Session Creation
    if (creemApiKey && creemApiKey !== "PLACEHOLDER") {
      try {
        const payload = {
          product_id: targetProductId,
          success_url: successUrl || "https://creem.io/checkout/success",
          cancel_url: cancelUrl || "https://creem.io/checkout/cancel",
          metadata: {
            userId: userId || userEmail || "anonymous",
            chromeId: chromeId || "",
            discountCode: discountCode || "",
            source: "tagsilo_chrome_extension",
            ...(metadata || {})
          }
        };

        if (discountCode) {
          payload.discount_code = discountCode;
        }

        if (userEmail) {
          payload.customer = { email: userEmail };
        }

        const creemRes = await fetch(`${apiHost}/v1/checkouts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": creemApiKey,
            "Authorization": `Bearer ${creemApiKey}`
          },
          body: JSON.stringify(payload)
        });

        if (creemRes.ok) {
          const checkoutData = await creemRes.json();
          const checkoutUrl = checkoutData.checkout_url || checkoutData.url || (checkoutData.id ? `https://creem.io/checkout/${checkoutData.id}` : null);

          if (checkoutUrl) {
            return res.status(200).json({
              success: true,
              checkoutUrl: checkoutUrl,
              id: checkoutData.id || null,
              mode: apiHost.includes("test") ? "test" : "production"
            });
          }
        }
      } catch (networkError) {
        console.error("[Vercel Checkout] Network error calling Creem API:", networkError);
      }
    }

    // 2. Direct Test Payment Link Fallback with Parameters
    const urlObj = new URL(directCheckoutUrl);
    if (discountCode) {
      urlObj.searchParams.set("discount_code", discountCode);
      urlObj.searchParams.set("coupon", discountCode);
    }
    if (userEmail) {
      urlObj.searchParams.set("email", userEmail);
    }
    if (userId) {
      urlObj.searchParams.set("user_id", userId);
    }

    return res.status(200).json({
      success: true,
      checkoutUrl: urlObj.toString(),
      mode: "direct_payment_link"
    });
  } catch (err) {
    console.error("[Vercel Checkout] Server exception:", err);
    return res.status(500).json({
      success: false,
      error: "Checkout service exception: " + err.message,
      checkoutUrl: DEFAULT_TEST_PAYMENT_URL
    });
  }
};
