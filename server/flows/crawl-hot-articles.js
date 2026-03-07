const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

const ARTICLES_FILE = path.join(__dirname, "../data/articles.json");

// Generate unique ID
const generateId = () => {
  return crypto.randomUUID();
};

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

/**
 * Crawl hot articles from VnExpress homepage
 * @returns {Promise<Array>} - List of article URLs
 */
async function crawlVnExpressHotArticles() {
  try {
    console.log("[CRAWL HOT] Crawling VnExpress...");
    const { data } = await axios.get("https://vnexpress.net/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(data);
    const articles = [];

    // Lấy bài viết từ các khu vực quan trọng
    const selectors = [
      ".box-category-tinmoi .title-news a", // Tin mới nhất
      ".box-tinxemnhieu .item-news a", // Tin xem nhiều
      ".box-focus .thumb-art a", // Tin tiêu điểm
      ".feature .thumb-art a", // Tin nổi bật
      ".item-news-common .thumb-art a", // Tin thường
    ];

    selectors.forEach((selector) => {
      $(selector).each((index, element) => {
        let href = $(element).attr("href");
        if (href) {
          // Nếu là relative URL, thêm domain
          if (href.startsWith("/")) {
            href = "https://vnexpress.net" + href;
          }
          // Chỉ lấy URL hợp lệ và không trùng
          if (
            href.startsWith("https://vnexpress.net/") &&
            !articles.includes(href) &&
            !href.includes("/video/") &&
            !href.includes("/podcast/") &&
            href.match(/-\d+\.html$/) // Phải là URL bài viết (có số-ID.html)
          ) {
            articles.push(href);
          }
        }
      });
    });

    console.log(`[CRAWL HOT] VnExpress: Found ${articles.length} articles`);
    return articles.slice(0, 10); // Lấy top 10
  } catch (error) {
    console.error("[CRAWL HOT] Error crawling VnExpress:", error.message);
    return [];
  }
}

/**
 * Crawl hot articles from Dân Trí
 * @returns {Promise<Array>} - List of article URLs
 */
async function crawlDanTriHotArticles() {
  try {
    console.log("[CRAWL HOT] Crawling Dân Trí...");
    const { data } = await axios.get("https://dantri.com.vn/tin-moi-nhat.htm", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(data);
    const articles = [];

    // Lấy bài viết từ các selector của Dân Trí
    const selectors = [
      "article h3 a", // Tiêu đề bài viết
      "article h4 a", // Tiêu đề phụ
      ".article-item h3 a", // Item bài viết
      ".article-title a", // Tiêu đề
    ];

    selectors.forEach((selector) => {
      $(selector).each((index, element) => {
        let href = $(element).attr("href");
        if (href) {
          // Loại bỏ query params
          href = href.split("?")[0];

          // Nếu là relative URL, thêm domain
          if (href.startsWith("/")) {
            href = "https://dantri.com.vn" + href;
          }

          // Chỉ lấy URL hợp lệ và không trùng
          if (
            href.startsWith("https://dantri.com.vn/") &&
            !articles.includes(href) &&
            !href.includes("/video/") &&
            !href.includes("/podcast/") &&
            href.match(/\.htm$/) // Phải là URL bài viết (kết thúc .htm)
          ) {
            articles.push(href);
          }
        }
      });
    });

    console.log(`[CRAWL HOT] Dân Trí: Found ${articles.length} articles`);
    return articles.slice(0, 10); // Lấy top 10
  } catch (error) {
    console.error("[CRAWL HOT] Error crawling Dân Trí:", error.message);
    return [];
  }
}

/**
 * Main function: Crawl hot articles from all sources and save
 * @returns {Promise<object>} - Result summary
 */
async function crawlAndSaveHotArticles() {
  const result = {
    success: false,
    vnexpress: { total: 0, new: 0 },
    dantri: { total: 0, new: 0 },
    errors: [],
  };

  try {
    console.log(
      "\n[CRAWL HOT] ========== Starting hot articles crawl ==========",
    );

    // Đọc danh sách articles hiện có
    const existingArticles = await readArticles();
    const existingLinks = new Set(existingArticles.map((a) => a.link));

    // Crawl từ các nguồn
    const vnexpressArticles = await crawlVnExpressHotArticles();
    const dantriArticles = await crawlDanTriHotArticles();

    result.vnexpress.total = vnexpressArticles.length;
    result.dantri.total = dantriArticles.length;

    // Lọc bỏ các bài đã tồn tại
    const newArticles = [];
    const allCrawledArticles = [
      ...vnexpressArticles.map((link) => ({ link, source: "vnexpress" })),
      ...dantriArticles.map((link) => ({ link, source: "dantri" })),
    ];

    for (const { link, source } of allCrawledArticles) {
      if (!existingLinks.has(link)) {
        const newArticle = {
          id: generateId(),
          link: link.trim(),
          status: "pending",
          source: source,
          crawledAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        newArticles.push(newArticle);
        existingLinks.add(link);

        if (source === "vnexpress") {
          result.vnexpress.new++;
        } else {
          result.dantri.new++;
        }
      }
    }

    // Lưu vào file nếu có bài mới
    if (newArticles.length > 0) {
      const updatedArticles = [...newArticles, ...existingArticles];
      await writeArticles(updatedArticles);
      console.log(
        `[CRAWL HOT] ✅ Saved ${newArticles.length} new articles to database`,
      );
    } else {
      console.log("[CRAWL HOT] ℹ️  No new articles found");
    }

    result.success = true;
    console.log("[CRAWL HOT] Summary:");
    console.log(
      `  - VnExpress: ${result.vnexpress.new}/${result.vnexpress.total} new`,
    );
    console.log(`  - Dân Trí: ${result.dantri.new}/${result.dantri.total} new`);
    console.log(`  - Total new articles: ${newArticles.length}`);
    console.log("[CRAWL HOT] ========== Crawl completed ==========\n");

    return result;
  } catch (error) {
    console.error("[CRAWL HOT] Fatal error:", error.message);
    result.errors.push(error.message);
    return result;
  }
}

module.exports = {
  crawlAndSaveHotArticles,
  crawlVnExpressHotArticles,
  crawlDanTriHotArticles,
};
