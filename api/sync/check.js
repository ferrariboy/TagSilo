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

    const cleanTarget = (profileUrl || "")
      .split("?")[0]
      .split("#")[0]
      .replace(/^https?:\/\/(www\.)?linkedin\.com/i, "")
      .replace(/\/$/, "")
      .toLowerCase();

    const candidateRanges = ["All_Pipelines!A:G", "Prospects!A:G", "Sheet1!A:G", "A:G"];
    let rows = [];

    for (const rng of candidateRanges) {
      try {
        const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(rng)}`;
        const sheetRes = await fetch(readUrl, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (sheetRes.ok) {
          const sheetData = await sheetRes.json();
          if (Array.isArray(sheetData.values) && sheetData.values.length > 1) {
            rows = sheetData.values;
            break;
          }
        }
      } catch (e) {}
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowRawUrl = (row[2] || "").toString();
      const rowClean = rowRawUrl
        .split("?")[0]
        .split("#")[0]
        .replace(/^https?:\/\/(www\.)?linkedin\.com/i, "")
        .replace(/\/$/, "")
        .toLowerCase();

      if (rowClean && cleanTarget && (rowClean === cleanTarget || cleanTarget.includes(rowClean) || rowClean.includes(cleanTarget))) {
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
