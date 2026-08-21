/**
 * Vercel Serverless Function: POST /api/sync/profile
 * Direct Serverless Google Sheets Synchronizer with Anti-Duplicate In-Place Update
 */

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { authToken, licenseKey, data } = req.body || {};

    if (!authToken) {
      return res.status(401).json({ success: false, error: "Google OAuth access token is required." });
    }

    if (!data || !data.fullName) {
      return res.status(400).json({ success: false, error: "Profile full name is required." });
    }

    const cleanUrl = (data.profileUrl || "").split("?")[0].replace(/\/$/, "");
    const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    const tagsStr = Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || "No Tags");
    const groupStr = data.group || "Prospects";
    const notesStr = data.notes || "No Notes Entered";
    const emailStr = data.email && data.email !== "Unavailable" ? data.email : "Cannot Find";

    // 1. Locate or Create "TagSilo Pro Pipeline Leads" Spreadsheet
    let spreadsheetId = null;
    const searchUrl = "https://www.googleapis.com/drive/v3/files?q=name='TagSilo%20Pro%20Pipeline%20Leads'%20and%20mimeType='application/vnd.google-apps.spreadsheet'%20and%20trashed=false&fields=files(id,name,webViewLink)";

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (searchRes.ok) {
      const searchJson = await searchRes.json();
      if (searchJson.files && searchJson.files.length > 0) {
        spreadsheetId = searchJson.files[0].id;
      }
    }

    // Create Spreadsheet if not found
    if (!spreadsheetId) {
      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: { title: "TagSilo Pro - Leads & Pipelines" },
          sheets: [
            {
              properties: {
                title: "All_Pipelines",
                gridProperties: { rowCount: 1000, columnCount: 8, frozenRowCount: 1 }
              }
            }
          ]
        })
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        return res.status(500).json({ success: false, error: "Google Sheets creation failed: " + errText });
      }

      const createJson = await createRes.json();
      spreadsheetId = createJson.spreadsheetId;

      // Initialize 8-Column Header (Columns A through H)
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/All_Pipelines!A1:H1?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: [["Saved Date", "Full Name", "Job Title", "LinkedIn URL", "Contact Email", "Pipeline Group", "Tags", "Context Notes"]]
        })
      });
    }

    // 2. Check for Duplicate Row (Column D: LinkedIn URL)
    let duplicateRowIndex = null;
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/All_Pipelines!A:H`;
    const readRes = await fetch(readUrl, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (readRes.ok) {
      const readJson = await readRes.json();
      const existingRows = readJson.values || [];
      const cleanTarget = cleanUrl.toLowerCase();

      for (let i = 1; i < existingRows.length; i++) {
        const row = existingRows[i];
        const rowUrl = (row[3] || row[2] || "").split("?")[0].replace(/\/$/, "").toLowerCase();
        if (rowUrl && (rowUrl === cleanTarget || cleanTarget.includes(rowUrl) || rowUrl.includes(cleanTarget))) {
          duplicateRowIndex = i + 1;
          break;
        }
      }
    }

    const jobTitleStr = data.jobTitle || data.headline || "No Job Title Listed";
    const rowData = [todayStr, data.fullName, jobTitleStr, cleanUrl, emailStr, groupStr, tagsStr, notesStr];

    // 3. Update Existing Row or Append New Row
    if (duplicateRowIndex) {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/All_Pipelines!A${duplicateRowIndex}:H${duplicateRowIndex}?valueInputOption=USER_ENTERED`;
      const updateRes = await fetch(updateUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ values: [rowData] })
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        return res.status(500).json({ success: false, error: "Failed to update row: " + errText });
      }

      return res.status(200).json({
        success: true,
        alreadyExists: true,
        updated: true,
        rowIndex: duplicateRowIndex,
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      });
    } else {
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/All_Pipelines!A:H:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
      const appendRes = await fetch(appendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ values: [rowData] })
      });

      if (!appendRes.ok) {
        const errText = await appendRes.text();
        return res.status(500).json({ success: false, error: "Failed to append row: " + errText });
      }

      return res.status(200).json({
        success: true,
        alreadyExists: false,
        created: true,
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      });
    }
  } catch (err) {
    console.error("[Vercel Sync Profile] Error:", err);
    return res.status(500).json({ success: false, error: "Sync failed: " + err.message });
  }
};
