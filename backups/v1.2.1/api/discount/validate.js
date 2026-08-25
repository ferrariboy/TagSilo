/**
 * Vercel Serverless Function: POST /api/discount/validate
 * Strict Live Creem API Discount Verification
 * Dynamically targets https://test-api.creem.io (for test keys) or https://api.creem.io (for live keys)
 */

function getCreemApiHost(apiKey) {
  return (apiKey && apiKey.startsWith("creem_test_"))
    ? "https://test-api.creem.io"
    : "https://api.creem.io";
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ valid: false, error: "Method not allowed. Use POST." });

  try {
    const { code } = req.body || {};
    const cleanCode = (code || "").trim();
    const creemApiKey = process.env.CREEM_API_KEY || "creem_test_619RIT0qqrUUPM7HoSLK2a";
    const apiHost = getCreemApiHost(creemApiKey);

    if (!cleanCode) {
      return res.status(400).json({ valid: false, message: "Please enter a discount code." });
    }

    console.log(`[Discount Check] Querying ${apiHost}/v1/discounts?discount_code=${cleanCode}`);

    // Query Creem API Live
    const creemRes = await fetch(`${apiHost}/v1/discounts?discount_code=${encodeURIComponent(cleanCode)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": creemApiKey
      }
    });

    if (creemRes.ok) {
      const discountData = await creemRes.json();
      console.log(`[Creem Discount Validated] Code: ${cleanCode}`, discountData);

      const percentOff = discountData.percent_off ?? discountData.percentage ?? 0;
      const is100Percent = percentOff >= 100;

      return res.status(200).json({
        valid: true,
        code: cleanCode,
        percentOff: percentOff,
        amountOff: discountData.amount_off || 0,
        is100Percent: is100Percent,
        discountId: discountData.id || null,
        message: is100Percent
          ? `100% Discount Code "${cleanCode}" verified! Pro plan activated.`
          : `Discount Code "${cleanCode}" (${percentOff}% OFF) verified!`,
        checkoutUrl: `https://www.creem.io/test/payment/prod_2UzZ3KgIogYrqFFCZ4N9SP?discount_code=${encodeURIComponent(cleanCode)}`
      });
    }

    // If discount code was not found
    const errText = await creemRes.text();
    console.warn(`[Discount Rejected] Code '${cleanCode}' not found:`, errText);

    return res.status(200).json({
      valid: false,
      message: `Discount code "${cleanCode}" is invalid or expired.`
    });
  } catch (err) {
    console.error("[Discount API Exception]:", err);
    return res.status(500).json({
      valid: false,
      error: "Unable to verify discount code: " + err.message
    });
  }
};
