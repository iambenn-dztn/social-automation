const express = require("express");
const router = express.Router();
const tokenController = require("../controllers/tokenController");

// Get current token info
router.get("/info", tokenController.getTokenInfo);

// Refresh Facebook access token
router.post("/refresh", tokenController.refreshToken);

module.exports = router;
