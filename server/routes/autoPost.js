const express = require("express");
const router = express.Router();
const autoPostController = require("../controllers/autoPostController");

// Get auto-post status
router.get("/status", autoPostController.getStatus);

// Get auto-post configuration
router.get("/config", autoPostController.getConfig);

// Update auto-post configuration
router.post("/config", autoPostController.updateConfig);

// Enable auto-posting
router.post("/enable", autoPostController.enable);

// Disable auto-posting
router.post("/disable", autoPostController.disable);

// Manually trigger auto-post job
router.post("/run-now", autoPostController.runNow);

// Get auto-post history
router.get("/history", autoPostController.getHistory);

module.exports = router;
