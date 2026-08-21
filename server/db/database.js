/**
 * Localized JSON File Database
 * Lightweight persistent storage for user subscription status and license states
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "subscriptions.json");

// Ensure data directory and db file exist
function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: {},
      subscriptions: {},
      webhook_logs: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

initDb();

function readDb() {
  try {
    initDb();
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[Database] Error reading database file:", err);
    return { users: {}, subscriptions: {}, webhook_logs: [] };
  }
}

function writeDb(data) {
  try {
    initDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Database] Error writing database file:", err);
  }
}

const db = {
  // Get User Profile & Subscription Status
  getUser(userId) {
    if (!userId) return null;
    const data = readDb();
    return data.users[userId.toLowerCase()] || null;
  },

  // Set / Update User Subscription Status ('active' | 'inactive')
  setUserStatus(userId, status, metadata = {}) {
    if (!userId) return null;
    const data = readDb();
    const key = userId.toLowerCase();

    const existing = data.users[key] || {};
    const updated = {
      userId: key,
      status: status, // 'active' | 'inactive'
      tier: status === "active" ? (metadata.tier || "pro") : "free",
      subscriptionId: metadata.subscriptionId || existing.subscriptionId || null,
      customerEmail: metadata.customerEmail || existing.customerEmail || key,
      licenseKey: metadata.licenseKey || existing.licenseKey || null,
      updatedAt: new Date().toISOString(),
      metadata: { ...(existing.metadata || {}), ...metadata }
    };

    data.users[key] = updated;

    if (metadata.subscriptionId) {
      data.subscriptions[metadata.subscriptionId] = {
        userId: key,
        status: status,
        updatedAt: new Date().toISOString()
      };
    }

    writeDb(data);
    console.log(`[Database] User '${key}' status updated to '${status}' (Tier: ${updated.tier})`);
    return updated;
  },

  // Log incoming webhook event for auditing
  logWebhook(event, payload, verified = true) {
    const data = readDb();
    const logEntry = {
      id: "wh_" + Date.now(),
      event,
      verified,
      receivedAt: new Date().toISOString(),
      payloadSummary: {
        eventType: event,
        subscriptionId: payload?.data?.id || payload?.id,
        userId: payload?.data?.metadata?.userId || payload?.data?.customer?.metadata?.user_id || payload?.data?.customer_email
      }
    };

    data.webhook_logs.unshift(logEntry);
    if (data.webhook_logs.length > 100) {
      data.webhook_logs = data.webhook_logs.slice(0, 100);
    }
    writeDb(data);
    return logEntry;
  },

  // Find user by License Key
  getUserByLicenseKey(licenseKey) {
    if (!licenseKey) return null;
    const data = readDb();
    const users = Object.values(data.users);
    return users.find(u => u.licenseKey === licenseKey || (u.metadata && u.metadata.licenseKey === licenseKey)) || null;
  }
};

module.exports = db;
