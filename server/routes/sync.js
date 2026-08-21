/**
 * Profile Synchronization & Verification Route
 * Validates Google OAuth tokens, license tiers, duplicate checks, and appends/updates lead records in Google Sheets
 */

const express = require("express");
const router = express.Router();

const SPREADSHEET_TITLE = "TagSilo Pro - Leads & Pipelines";
const SHEET_NAME = "All_Pipelines";

/**
 * Check if a profile URL already exists in Google Sheets
 * Route: POST /api/sync/check
 */
router.post("/check", async (req, res) => {
  try {
    const { authToken, profileUrl, sheetId } = req.body;

    if (!profileUrl) {
      return res.json({ success: true, exists: false });
    }

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: "Google OAuth authorization token required."
      });
    }

    const targetUrl = profileUrl.split("?")[0].split("#")[0].replace(/\/$/, "").toLowerCase();
    let spreadsheetId = sheetId || null;

    // Search Drive if sheetId not passed
    if (!spreadsheetId) {
      try {
        const q = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
        const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.files && searchData.files.length > 0) {
            spreadsheetId = searchData.files[0].id;
          }
        }
      } catch (e) {
        console.warn("[Backend Sync Check] Drive search notice:", e.message);
      }
    }

    if (!spreadsheetId) {
      return res.json({ success: true, exists: false, message: "No spreadsheet created yet." });
    }

    const range = encodeURIComponent(`${SHEET_NAME}!A:G`);
    let rowsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (!rowsRes.ok) {
      const fallbackRange = encodeURIComponent("A:G");
      rowsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${fallbackRange}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    }

    if (rowsRes.ok) {
      const json = await rowsRes.json();
      const rows = json.values || [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowUrl = (row[2] || "").split("?")[0].split("#")[0].replace(/\/$/, "").toLowerCase();
        if (rowUrl && targetUrl && (rowUrl === targetUrl || targetUrl.includes(rowUrl) || rowUrl.includes(targetUrl))) {
          return res.json({
            success: true,
            exists: true,
            rowIndex: i + 1,
            spreadsheetId,
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
    }

    return res.json({ success: true, exists: false, spreadsheetId });
  } catch (err) {
    console.error("[Backend Sync Check] Error:", err);
    return res.status(500).json({ success: false, error: err.message, exists: false });
  }
});

/**
 * Main Profile Synchronization Route
 * Route: POST /api/sync/profile
 */
router.post("/profile", async (req, res) => {
  try {
    const { authToken, licenseKey, data } = req.body;

    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: "Google OAuth authorization token is required."
      });
    }

    if (!data || !data.fullName || !data.profileUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing required profile fields (fullName, profileUrl)."
      });
    }

    // 1. Verify License Status via Creem (if provided)
    let isPro = false;
    if (licenseKey && licenseKey.trim()) {
      const creemApiKey = process.env.CREEM_API_KEY;
      if (creemApiKey && creemApiKey !== "PLACEHOLDER") {
        try {
          const vRes = await fetch("https://api.creem.io/v1/licenses/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": creemApiKey,
              "Authorization": `Bearer ${creemApiKey}`
            },
            body: JSON.stringify({ key: licenseKey })
          });
          if (vRes.ok) {
            const vData = await vRes.json();
            isPro = vData.valid ?? true;
          }
        } catch (e) {
          console.warn("[Backend Sync] License check warning:", e.message);
        }
      } else {
        isPro = /^(TS|CREEM)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/i.test(licenseKey) || licenseKey.length >= 16;
      }
    }

    // 2. Locate or Create Google Spreadsheet for user
    let spreadsheetId = null;
    let spreadsheetUrl = null;

    try {
      const q = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          spreadsheetId = searchData.files[0].id;
          spreadsheetUrl = searchData.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
        }
      }
    } catch (driveErr) {
      console.warn("[Backend Sync] Drive search note:", driveErr.message);
    }

    // Create spreadsheet if not found
    if (!spreadsheetId) {
      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: { title: SPREADSHEET_TITLE },
          sheets: [{ properties: { title: SHEET_NAME, gridProperties: { frozenRowCount: 1 } } }]
        })
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        return res.status(createRes.status).json({
          success: false,
          error: `Google Sheets creation failed: ${errText}`
        });
      }

      const created = await createRes.json();
      spreadsheetId = created.spreadsheetId;
      spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      // Initialize 7-Column Header
      const headers = [
        "Saved Date",
        "Full Name",
        "LinkedIn URL",
        "Contact Email",
        "Pipeline Group",
        "Tags",
        "Context Notes"
      ];

      const rangeHeader = encodeURIComponent(`${SHEET_NAME}!A1:G1`);
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeHeader}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          range: `${SHEET_NAME}!A1:G1`,
          majorDimension: "ROWS",
          values: [headers]
        })
      });
    }

    // 3. Duplicate Detection Check (Column C: LinkedIn URL)
    const targetUrl = (data.profileUrl || "").split("?")[0].split("#")[0].replace(/\/$/, "").toLowerCase();
    let existingRowIndex = -1;

    try {
      const checkRange = encodeURIComponent(`${SHEET_NAME}!A:G`);
      let checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${checkRange}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!checkRes.ok) {
        const checkFallback = encodeURIComponent("A:G");
        checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${checkFallback}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      }

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        const existingRows = checkData.values || [];

        for (let i = 1; i < existingRows.length; i++) {
          const row = existingRows[i];
          const rowUrl = (row[2] || "").split("?")[0].split("#")[0].replace(/\/$/, "").toLowerCase();
          if (rowUrl && targetUrl && (rowUrl === targetUrl || targetUrl.includes(rowUrl) || rowUrl.includes(targetUrl))) {
            existingRowIndex = i + 1;
            break;
          }
        }
      }
    } catch (scanErr) {
      console.warn("[Backend Sync] Duplicate scan notice:", scanErr.message);
    }

    const rawEmail = (data.email || "").replace(/^Email:\s*/i, "").trim();
    const cleanEmail = rawEmail && rawEmail !== "Unavailable" ? rawEmail : "Cannot Find";

    const rowValues = [
      new Date().toLocaleString("en-US", { timeZoneName: "short" }),
      data.fullName || "",
      data.profileUrl || "",
      cleanEmail,
      data.group || "Prospects",
      Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || ""),
      data.notes || ""
    ];

    // 4. Update existing row or append new row
    if (existingRowIndex > 0) {
      const updateRange = encodeURIComponent(`${SHEET_NAME}!A${existingRowIndex}:G${existingRowIndex}`);
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          range: `${SHEET_NAME}!A${existingRowIndex}:G${existingRowIndex}`,
          majorDimension: "ROWS",
          values: [rowValues]
        })
      });

      return res.json({
        success: true,
        alreadyExists: true,
        updated: true,
        rowIndex: existingRowIndex,
        spreadsheetId,
        spreadsheetUrl,
        message: "Profile already saved! Updated existing record in Google Sheets."
      });
    }

    // Append New Row
    const rangeAppend = encodeURIComponent(`${SHEET_NAME}!A:G`);
    let appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeAppend}:append?valueInputOption=USER_ENTERED`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        range: `${SHEET_NAME}!A:G`,
        majorDimension: "ROWS",
        values: [rowValues]
      })
    });

    if (!appendRes.ok) {
      const rangeFallback = encodeURIComponent("A:G");
      appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeFallback}:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          range: "A:G",
          majorDimension: "ROWS",
          values: [rowValues]
        })
      });
    }

    if (!appendRes.ok) {
      const errText = await appendRes.text();
      return res.status(appendRes.status).json({
        success: false,
        error: `Google Sheets append failed: ${errText}`
      });
    }

    return res.json({
      success: true,
      alreadyExists: false,
      updated: false,
      spreadsheetId,
      spreadsheetUrl,
      message: "Profile row successfully synchronized to Google Sheets."
    });
  } catch (error) {
    console.error("[Backend Sync] Exception:", error);
    return res.status(500).json({
      success: false,
      error: "Internal synchronization error: " + error.message
    });
  }
});

module.exports = router;
