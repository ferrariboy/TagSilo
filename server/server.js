/**
 * TagSilo Pro - Express Application Server Entrypoint
 * Manages License Validation, Creem Checkout Sessions, Unauthenticated Webhooks, and Profile Sync Pipelines
 */

const path = require("path");
// Load environment variables from the root .env file
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");

const licenseRoutes = require("./routes/license");
const checkoutRoutes = require("./routes/checkout");
const webhookRoutes = require("./routes/webhook");
const syncRoutes = require("./routes/sync");

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "TagSilo Pro Backend",
    timestamp: new Date().toISOString(),
    env: {
      creemKeyConfigured: !!(process.env.CREEM_API_KEY && process.env.CREEM_API_KEY !== "PLACEHOLDER"),
      creemWebhookConfigured: !!(process.env.CREEM_WEBHOOK_SECRET && process.env.CREEM_WEBHOOK_SECRET !== "PLACEHOLDER")
    }
  });
});

// Mount API Routes
app.use("/api/license", licenseRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/webhooks", webhookRoutes); // Dedicated POST /api/webhooks/creem
app.use("/api/webhook", webhookRoutes);  // Alias POST /api/webhook/creem
app.use("/api/sync", syncRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("[Backend Server Error]", err);
  res.status(500).json({ error: err.message || "Internal server error." });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`⚡ TagSilo Pro Backend Server Online`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/api/webhooks/creem`);
  console.log(`🛒 Checkout Endpoint: http://localhost:${PORT}/api/checkout`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`👑 Creem API Key: ${process.env.CREEM_API_KEY ? "Configured" : "Missing"}`);
  console.log(`🛡️ Webhook Secret: ${process.env.CREEM_WEBHOOK_SECRET ? "Configured" : "Missing"}`);
  console.log(`=========================================`);
});

module.exports = app;
