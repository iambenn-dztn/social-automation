const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController");

// Get all contents from output folder
router.get("/", contentController.getAllContents);

// Get single content by ID
router.get("/:id", contentController.getContentById);

// Delete content
router.delete("/:id", contentController.deleteContent);

module.exports = router;
