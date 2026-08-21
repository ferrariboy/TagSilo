/**
 * Vercel Serverless Function: POST /api/sync/check
 * Checks if a profile URL already exists in user's Google Sheet
 */

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { authToken, profileUrl, sheetId } = req.body || {};
    if (!authToken || !profileUrl || !sheetId) {
      return res.status(200).json({ success: true, exists: false });
    }

    const cleanTargetUrl = profileUrl.split("?")[0].replace(/\/$/, "").toLowerCase();
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/All_Pipelines!A:G`;

    const sheetRes = await fetch(readUrl, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!sheetRes.ok) {
      return res.status(200).json({ success: true, exists: false });
    }

    const sheetData = await sheetRes.json();
    const rows = sheetData.values || [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowUrl = (row[2] || "").split("?")[0].replace(/\/$/, "").toLowerCase();

      if (rowUrl && (rowUrl === cleanTargetUrl || cleanTargetUrl.includes(rowUrl) || rowUrl.includes(cleanTargetUrl))) {
        return res.status(200).json({
          success: true,
          exists: true,
          rowIndex: i + 1,
          data: {
            date: row[0] || "",
            name: row[1] || "",
            url: row[2] || "",
            email: row[3] || "",
            group: row[4] || "",
            tags: row[5] || "",
            notes: row[6] || ""
          }
        });
      }
    }

    return res.status(200).json({ success: true, exists: false });
  } catch (err) {
    return res.status(200).json({ success: true, exists: false, note: err.message });
  }
};
