const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { rewriteArticle } = require("../flows/rewrite-content-new");
const {
  rewriteAndPostToAllChannels,
} = require("../flows/article-rewrite-and-post");

const ARTICLES_FILE = path.join(__dirname, "../data/articles.json");

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(__dirname, "../data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Read articles from JSON file
const readArticles = async () => {
  try {
    await ensureDataDir();
    const data = await fs.readFile(ARTICLES_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, return empty array
      return [];
    }
    throw error;
  }
};

// Write articles to JSON file
const writeArticles = async (articles) => {
  await ensureDataDir();
  await fs.writeFile(ARTICLES_FILE, JSON.stringify(articles, null, 2), "utf8");
};

// Generate unique ID using UUID
const generateId = () => {
  return crypto.randomUUID();
};

// Get all articles
const getArticles = async (req, res) => {
  try {
    const articles = await readArticles();
    res.json({
      success: true,
      articles: articles.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      ),
    });
  } catch (error) {
    console.error("Error getting articles:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách bài báo",
      error: error.message,
    });
  }
};

// Add new article
const addArticle = async (req, res) => {
  try {
    const { link } = req.body;

    if (!link || !link.trim()) {
      return res.status(400).json({
        success: false,
        message: "Link bài báo không được để trống",
      });
    }

    // Validate URL format
    try {
      new URL(link);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Link không hợp lệ",
      });
    }

    const articles = await readArticles();

    // Check if article already exists
    const existingArticle = articles.find((a) => a.link === link);
    if (existingArticle) {
      return res.status(400).json({
        success: false,
        message: "Bài báo này đã tồn tại",
      });
    }

    const newArticle = {
      id: generateId(),
      link: link.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    articles.push(newArticle);
    await writeArticles(articles);

    console.log(
      `[ADD ARTICLE] Added article ${newArticle.id}, starting rewrite and post...`,
    );

    // Trigger rewrite and post to all channels (wait for completion)
    try {
      const result = await rewriteAndPostToAllChannels(
        newArticle.id,
        newArticle.link,
      );

      console.log(
        `[ADD ARTICLE] Completed: ${result.postingResults.filter((r) => r.success).length}/${result.postingResults.length} posts successful`,
      );

      // Update article status to active after successful posting
      const articleIndex = articles.findIndex((a) => a.id === newArticle.id);
      if (articleIndex !== -1 && result.success) {
        articles[articleIndex].status = "posted";
        articles[articleIndex].updatedAt = new Date().toISOString();
        await writeArticles(articles);
      }

      res.json({
        success: true,
        message: "Thêm bài báo, rewrite và đăng thành công",
        article: articles.find((a) => a.id === newArticle.id),
        content: result.content
          ? {
              id: result.content.id,
              title: result.content.title,
              summary: result.content.summary,
            }
          : null,
        postingResults: result.postingResults,
        errors: result.errors,
      });
    } catch (error) {
      console.error("[ADD ARTICLE] Error during rewrite/post:", error.message);

      // Even if posting fails, article is still added
      res.json({
        success: true,
        message:
          "Đã thêm bài báo nhưng có lỗi khi rewrite/đăng: " + error.message,
        article: newArticle,
        content: null,
        postingResults: [],
        errors: [{ stage: "rewrite_or_post", error: error.message }],
      });
    }
  } catch (error) {
    console.error("Error adding article:", error);
    res.status(500).json({
      success: false,
      message: "Không thể thêm bài báo",
      error: error.message,
    });
  }
};

// Update article status
const updateArticleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["pending", "active", "inactive", "posted"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Trạng thái không hợp lệ. Chỉ chấp nhận: pending, active, inactive, posted",
      });
    }

    const articles = await readArticles();
    const articleIndex = articles.findIndex((a) => a.id === id);

    if (articleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài báo",
      });
    }

    articles[articleIndex].status = status;
    articles[articleIndex].updatedAt = new Date().toISOString();
    await writeArticles(articles);

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      article: articles[articleIndex],
    });
  } catch (error) {
    console.error("Error updating article status:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật trạng thái",
      error: error.message,
    });
  }
};

// Delete article
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const articles = await readArticles();
    const articleIndex = articles.findIndex((a) => a.id === id);

    if (articleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài báo",
      });
    }

    articles.splice(articleIndex, 1);
    await writeArticles(articles);

    res.json({
      success: true,
      message: "Xóa bài báo thành công",
    });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa bài báo",
      error: error.message,
    });
  }
};

// Regenerate content for an existing article
const regenerateArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const articles = await readArticles();
    const article = articles.find((a) => a.id === id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài báo",
      });
    }

    // Trigger content rewriting (async, don't wait for completion)
    rewriteArticle(article.id, article.link).catch((err) => {
      console.error("Error in background rewrite:", err);
    });

    res.json({
      success: true,
      message:
        "Đã bắt đầu crawl và gen lại nội dung. Vui lòng kiểm tra trong vài phút.",
      article: article,
    });
  } catch (error) {
    console.error("Error regenerating article:", error);
    res.status(500).json({
      success: false,
      message: "Không thể gen lại nội dung",
      error: error.message,
    });
  }
};

module.exports = {
  getArticles,
  addArticle,
  updateArticleStatus,
  deleteArticle,
  regenerateArticle,
};
