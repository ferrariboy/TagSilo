const { supabase, isSupabaseConfigured } = require("../../lib/supabase");

module.exports = async (req, res) => {
  // CORS Headers
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
    const { email, name, picture, chromeId } = req.body || {};

    const cleanEmail = (email || "").toLowerCase().trim();
    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: "Email is required." });
    }

    const cleanFullName = (name || "").trim();
    const nameParts = cleanFullName.split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const cleanPicture = (picture || "").trim();
    const cleanChromeId = (chromeId || "").trim();

    let userRecord = null;

    if (isSupabaseConfigured()) {
      try {
        // 1. Check if user already exists in database
        const { data: existingUsers, error: findErr } = await supabase
          .from("users")
          .select("*")
          .eq("email", cleanEmail)
          .limit(1);

        if (!findErr && existingUsers && existingUsers.length > 0) {
          userRecord = existingUsers[0];

          // Update profile details (preserving existing tier & subscription status)
          const updatePayload = {
            first_name: firstName || userRecord.first_name,
            last_name: lastName || userRecord.last_name,
            full_name: cleanFullName || userRecord.full_name,
            picture: cleanPicture || userRecord.picture,
            chrome_id: cleanChromeId || userRecord.chrome_id,
            updated_at: new Date().toISOString()
          };

          const { data: updatedUsers, error: updateErr } = await supabase
            .from("users")
            .update(updatePayload)
            .eq("email", cleanEmail)
            .select();

          if (!updateErr && updatedUsers && updatedUsers.length > 0) {
            userRecord = updatedUsers[0];
          }
        } else {
          // 2. Insert new user record (Free tier default)
          const insertPayload = {
            email: cleanEmail,
            first_name: firstName,
            last_name: lastName,
            full_name: cleanFullName,
            picture: cleanPicture,
            chrome_id: cleanChromeId,
            tier: "free",
            subscription_status: "free",
            daily_sync_count: 0,
            last_sync_date: new Date().toISOString().split("T")[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: insertedUsers, error: insertErr } = await supabase
            .from("users")
            .insert(insertPayload)
            .select();

          if (!insertErr && insertedUsers && insertedUsers.length > 0) {
            userRecord = insertedUsers[0];
          } else if (insertErr) {
            console.error("[User Sync] Supabase insert error:", insertErr.message);
          }
        }
      } catch (dbErr) {
        console.error("[User Sync] Database error:", dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        email: userRecord?.email || cleanEmail,
        firstName: userRecord?.first_name || firstName,
        lastName: userRecord?.last_name || lastName,
        fullName: userRecord?.full_name || cleanFullName,
        tier: userRecord?.tier || "free",
        subscriptionStatus: userRecord?.subscription_status || "free"
      },
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("[User Sync] Exception:", err);
    return res.status(500).json({
      success: false,
      error: "User sync exception: " + err.message
    });
  }
};
