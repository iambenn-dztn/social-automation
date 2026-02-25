const express = require("express");
const router = express.Router();
const contentController = require("../controllers/contentController");

// Get all contents from output folder
router.get("/", contentController.getAllContents);

// Get single content by ID
router.get("/:id", contentController.getContentById);

// Update content
router.put("/:id", contentController.updateContent);

// Delete content
router.delete("/:id", contentController.deleteContent);

module.exports = router;
