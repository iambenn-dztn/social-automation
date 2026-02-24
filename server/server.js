const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Import routes
const facebookRoutes = require("./routes/facebook");
const platformRoutes = require("./routes/platform");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use("/api/facebook", facebookRoutes); // Legacy Facebook-only routes
app.use("/api/platform", platformRoutes); // New multi-platform routes

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Multi-Platform Automation Server is running",
    timestamp: new Date().toISOString(),
    platforms: ["facebook", "shopee"],
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal Server Error",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Multi-Platform Automation Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Supported platforms: Facebook, Shopee`);
  console.log(`📚 API Endpoints:`);
  console.log(`   - GET  /api/platform/platforms (Get available platforms)`);
  console.log(`   - GET  /api/platform/channels   (Get channels)`);
  console.log(`   - POST /api/platform/post       (Post to channels)`);
  console.log(`   - GET  /api/platform/history    (Get history)`);
});
