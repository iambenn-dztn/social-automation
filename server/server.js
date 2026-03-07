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
const articleRoutes = require("./routes/articles");
const contentRoutes = require("./routes/contents");
const autoPostRoutes = require("./routes/autoPost");
const tokenRoutes = require("./routes/token");

// Import auto-post scheduler
const autoPost = require("./flows/auto-post");
const { seedData } = require("./utils/seedData");

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
app.use("/api/facebook", facebookRoutes); // Legacy Facebook-only rout
app.use("/api/articles", articleRoutes); // Article management routeses
app.use("/api/contents", contentRoutes); // Rewritten content management
app.use("/api/platform", platformRoutes); // New multi-platform routes
app.use("/api/auto-post", autoPostRoutes); // Auto-post scheduler management
app.use("/api/token", tokenRoutes); // Token management

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Multi-Platform Automation Server is running",
    timestamp: new Date().toISOString(),
    platforms: ["facebook", "shopee"],
  });
});

// Serve static files from React build (for production)
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client/build");
  app.use(express.static(clientBuildPath));

  // All non-API routes serve React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || "Internal Server Error",
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`✅ Multi-Platform Automation Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Supported platforms: Facebook, Shopee`);
  console.log(`📚 API Endpoints:`);
  console.log(`   - GET  /api/platform/platforms (Get available platforms)`);
  console.log(`   - GET  /api/platform/channels   (Get channels)`);
  console.log(`   - POST /api/platform/post       (Post to channels)`);
  console.log(`   - GET  /api/articles            (Get articles)`);
  console.log(`   - POST /api/articles            (Add article)`);
  console.log(`   - GET  /api/platform/history    (Get history)`);
  console.log(`   - GET  /api/auto-post/status    (Get auto-post status)`);
  console.log(`   - POST /api/auto-post/enable    (Enable auto-post)`);
  console.log(`   - POST /api/auto-post/disable   (Disable auto-post)`);

  // Seed initial data (runs only on first deployment)
  try {
    await seedData();
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
  }

  // Start hot articles crawler (runs every 10 minutes)
  try {
    autoPost.startHotArticlesCrawler();
    console.log("🔥 Hot articles crawler started (runs every 10 minutes)");
  } catch (error) {
    console.error("❌ Error starting hot articles crawler:", error.message);
  }
});
