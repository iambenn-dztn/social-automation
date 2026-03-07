const express = require("express");
const router = express.Router();
const autoPostController = require("../controllers/autoPostController");

// Get auto-post status
router.get("/status", autoPostController.getStatus);

// Get hot crawler config
router.get("/config", autoPostController.getConfig);

// Update hot crawler config
router.post("/config", autoPostController.updateConfig);

// Hot articles crawler routes
router.post("/hot-crawler/start", autoPostController.startHotCrawler);
router.post("/hot-crawler/stop", autoPostController.stopHotCrawler);

// Crawl, select best, and auto-post to all pages
router.post("/crawl-and-post", autoPostController.crawlAndAutoPost);

module.exports = router;
