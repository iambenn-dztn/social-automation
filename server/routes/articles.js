const express = require("express");
const router = express.Router();
const articleController = require("../controllers/articleController");

// Get all articles
router.get("/", articleController.getArticles);

// Add new article
router.post("/", articleController.addArticle);

// Update article status
router.patch("/:id/status", articleController.updateArticleStatus);

// Delete article
router.delete("/:id", articleController.deleteArticle);

module.exports = router;
