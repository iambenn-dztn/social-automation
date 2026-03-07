const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { rewriteArticle } = require("./rewrite-content-new");
const platformFactory = require("../platforms");
const { getFacebookToken } = require("../utils/facebookConfig");

const ARTICLES_FILE = path.join(__dirname, "../data/articles.json");
const OUTPUT_DIR = path.join(__dirname, "../data/output");

// High-value keywords for article ranking (Vietnamese)
const HIGH_VALUE_KEYWORDS = {
  drama: [
    "scandal",
    "tranh cãi",
    "gây sốc",
    "drama",
    "ồn ào",
    "nóng",
    "sốt",
    "phẫn nộ",
    "gay gắt",
    "căng thẳng",
  ],
  entertainment: [
    "nghệ sĩ",
    "ca sĩ",
    "diễn viên",
    "sao việt",
    "showbiz",
    "giải trí",
    "phim",
    "hát",
    "âm nhạc",
  ],
  politics: [
    "chính trị",
    "tổng thống",
    "thủ tướng",
    "quốc hội",
    "chính phủ",
    "ngoại giao",
    "luật",
    "bộ trưởng",
  ],
  economy: [
    "giá vàng",
    "vàng",
    "chứng khoán",
    "bất động sản",
    "kinh tế",
    "đầu tư",
    "tài chính",
    "lạm phát",
    "USD",
    "tiền tệ",
  ],
  hot: [
    "nóng",
    "mới nhất",
    "khẩn cấp",
    "đột phá",
    "viral",
    "trending",
    "hot",
    "bất ngờ",
  ],
};

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
 * Extract article title from HTML
 */
async function extractArticleTitle(url, html, source) {
  try {
    const $ = cheerio.load(html);
    let title = "";

    if (source === "vnexpress") {
      title =
        $("h1.title-detail").text().trim() ||
        $('meta[property="og:title"]').attr("content") ||
        "";
    } else if (source === "dantri") {
      title =
        $("h1.title-page").text().trim() ||
        $("h1.e-magazine__title").text().trim() ||
        $('meta[property="og:title"]').attr("content") ||
        "";
    }

    return title;
  } catch (error) {
    console.error(
      `[EXTRACT] Error extracting title from ${url}:`,
      error.message,
    );
    return "";
  }
}

/**
 * Score article based on keywords in title and URL
 */
function scoreArticle(title, url) {
  let score = 0;
  const textToCheck = (title + " " + url).toLowerCase();

  // Score by category (higher = better)
  const categoryScores = {
    drama: 10,
    hot: 8,
    economy: 7,
    politics: 6,
    entertainment: 5,
  };

  for (const [category, keywords] of Object.entries(HIGH_VALUE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textToCheck.includes(keyword.toLowerCase())) {
        score += categoryScores[category] || 3;
        // Only count once per category
        break;
      }
    }
  }

  // Bonus for certain patterns
  if (textToCheck.includes("giá vàng")) score += 5;
  if (textToCheck.includes("tổng thống")) score += 5;
  if (textToCheck.includes("scandal")) score += 8;

  return score;
}

/**
 * Crawl hot articles from VnExpress
 */
async function crawlVnExpressHotArticles() {
  try {
    console.log("[CRAWL] Crawling VnExpress...");
    const { data } = await axios.get("https://vnexpress.net/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(data);
    const articles = [];

    const selectors = [
      ".box-category-tinmoi .title-news a",
      ".box-tinxemnhieu .item-news a",
      ".box-focus .thumb-art a",
      ".feature .thumb-art a",
      ".item-news-common .thumb-art a",
    ];

    selectors.forEach((selector) => {
      $(selector).each((index, element) => {
        let href = $(element).attr("href");
        if (href) {
          if (href.startsWith("/")) {
            href = "https://vnexpress.net" + href;
          }
          if (
            href.startsWith("https://vnexpress.net/") &&
            !articles.includes(href) &&
            !href.includes("/video/") &&
            !href.includes("/podcast/") &&
            href.match(/-\d+\.html$/)
          ) {
            articles.push(href);
          }
        }
      });
    });

    console.log(`[CRAWL] VnExpress: Found ${articles.length} articles`);
    return articles.slice(0, 15);
  } catch (error) {
    console.error("[CRAWL] Error crawling VnExpress:", error.message);
    return [];
  }
}

/**
 * Crawl hot articles from Dân Trí
 */
async function crawlDanTriHotArticles() {
  try {
    console.log("[CRAWL] Crawling Dân Trí...");
    const { data } = await axios.get("https://dantri.com.vn/tin-moi-nhat.htm", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(data);
    const articles = [];

    const selectors = [
      "article h3 a",
      "article h4 a",
      ".article-item h3 a",
      ".article-title a",
    ];

    selectors.forEach((selector) => {
      $(selector).each((index, element) => {
        let href = $(element).attr("href");
        if (href) {
          href = href.split("?")[0];
          if (href.startsWith("/")) {
            href = "https://dantri.com.vn" + href;
          }
          if (
            href.startsWith("https://dantri.com.vn/") &&
            !articles.includes(href) &&
            !href.includes("/video/") &&
            !href.includes("/podcast/") &&
            href.match(/\.htm$/)
          ) {
            articles.push(href);
          }
        }
      });
    });

    console.log(`[CRAWL] Dân Trí: Found ${articles.length} articles`);
    return articles.slice(0, 15);
  } catch (error) {
    console.error("[CRAWL] Error crawling Dân Trí:", error.message);
    return [];
  }
}

/**
 * Find latest content by article ID from output files
 */
async function findLatestContentByArticleId(articleId) {
  try {
    const files = await fs.readdir(OUTPUT_DIR);
    const contentFiles = files.filter((f) => f.startsWith("content-"));

    // Sort by date (newest first)
    contentFiles.sort((a, b) => b.localeCompare(a));

    for (const file of contentFiles) {
      const filePath = path.join(OUTPUT_DIR, file);
      const data = await fs.readFile(filePath, "utf8");
      const contents = JSON.parse(data);

      const found = contents.find((c) => c.articleId === articleId);
      if (found) {
        return found;
      }
    }

    return null;
  } catch (error) {
    console.error("[FIND CONTENT] Error:", error.message);
    return null;
  }
}

/**
 * Main function: Crawl, select best article, rewrite uniquely per channel, and post
 */
async function crawlSelectAndAutoPost(articlesPerRun = 1) {
  const result = {
    success: false,
    selectedArticles: [],
    postingResults: [],
    errors: [],
  };

  try {
    console.log(
      `\n[AUTO-POST] ========== Starting crawl and auto-post (${articlesPerRun} articles) ==========`,
    );

    // Step 1: Crawl from sources
    console.log("[AUTO-POST] Step 1/5: Crawling articles from sources...");
    const vnexpressArticles = await crawlVnExpressHotArticles();
    const dantriArticles = await crawlDanTriHotArticles();

    const allCrawledUrls = [
      ...vnexpressArticles.map((link) => ({ link, source: "vnexpress" })),
      ...dantriArticles.map((link) => ({ link, source: "dantri" })),
    ];

    console.log(`[AUTO-POST] Total crawled: ${allCrawledUrls.length} articles`);

    if (allCrawledUrls.length === 0) {
      throw new Error("No articles found from sources");
    }

    // Step 2: Filter out already posted articles
    console.log("[AUTO-POST] Step 2/5: Filtering out duplicate articles...");
    const existingArticles = await readArticles();
    const existingLinks = new Set(existingArticles.map((a) => a.link));

    const newArticles = allCrawledUrls.filter(
      ({ link }) => !existingLinks.has(link),
    );

    console.log(
      `[AUTO-POST] New articles after filtering: ${newArticles.length}`,
    );

    if (newArticles.length === 0) {
      console.log("[AUTO-POST] ℹ️  No new articles found, skipping...");
      result.success = true;
      return result;
    }

    // Step 3: Score and select best articles
    console.log(
      `[AUTO-POST] Step 3/5: Scoring and selecting top ${articlesPerRun} article(s)...`,
    );

    const scoredArticles = [];

    // Fetch titles for scoring (limit to first 10 to avoid timeout)
    const articlesToScore = newArticles.slice(0, 10);

    for (const { link, source } of articlesToScore) {
      try {
        const { data: html } = await axios.get(link, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 10000,
        });

        const title = await extractArticleTitle(link, html, source);
        const score = scoreArticle(title, link);

        scoredArticles.push({
          link,
          source,
          title,
          score,
        });

        console.log(
          `[AUTO-POST]   - [${source}] Score: ${score} - ${title.substring(0, 60)}...`,
        );
      } catch (error) {
        console.error(`[AUTO-POST] Error fetching ${link}:`, error.message);
        // Add with score 0 as fallback
        scoredArticles.push({
          link,
          source,
          title: "",
          score: 0,
        });
      }
    }

    // Sort by score (highest first) and select top N
    scoredArticles.sort((a, b) => b.score - a.score);

    const selectedArticles = scoredArticles.slice(
      0,
      Math.min(articlesPerRun, scoredArticles.length),
    );

    console.log(
      `[AUTO-POST] ✅ Selected ${selectedArticles.length} article(s):`,
    );
    selectedArticles.forEach((article, index) => {
      console.log(
        `[AUTO-POST]    ${index + 1}. [Score: ${article.score}] ${article.title || article.link}`,
      );
    });

    // Step 4: Save selected articles
    console.log(
      "[AUTO-POST] Step 4/5: Saving selected articles to database...",
    );

    const newArticleEntries = selectedArticles.map((article) => ({
      id: generateId(),
      link: article.link.trim(),
      status: "pending",
      source: article.source,
      title: article.title,
      score: article.score,
      crawledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }));

    const updatedArticles = [...newArticleEntries, ...existingArticles];
    await writeArticles(updatedArticles);

    result.selectedArticles = newArticleEntries;
    console.log(`[AUTO-POST] ✅ ${newArticleEntries.length} article(s) saved`);

    // Step 5: Get all channels
    console.log(
      "[AUTO-POST] Step 5/5: Rewriting and posting to all channels...",
    );

    const platformConfigs = {
      facebook: {
        accessToken: await getFacebookToken(),
      },
      shopee: {
        partnerId: process.env.SHOPEE_PARTNER_ID,
        partnerKey: process.env.SHOPEE_PARTNER_KEY,
        shopId: process.env.SHOPEE_SHOP_ID,
      },
    };

    // Get all channels
    const allChannels = [];

    for (const [platformName, config] of Object.entries(platformConfigs)) {
      try {
        if (!config || Object.values(config).some((v) => !v)) {
          console.log(
            `[AUTO-POST] ${platformName} not configured, skipping...`,
          );
          continue;
        }

        const platform = platformFactory.create(platformName, config);
        const channels = await platform.getChannels();

        channels.forEach((channel) => {
          allChannels.push({
            platform: platformName,
            ...channel,
          });
        });

        console.log(
          `[AUTO-POST] Found ${channels.length} ${platformName} channels`,
        );
      } catch (error) {
        console.error(
          `[AUTO-POST] Error getting ${platformName} channels:`,
          error.message,
        );
        result.errors.push({
          platform: platformName,
          stage: "get_channels",
          error: error.message,
        });
      }
    }

    if (allChannels.length === 0) {
      throw new Error("No channels available for posting");
    }

    console.log(`[AUTO-POST] Total channels to post: ${allChannels.length}`);

    // Post each article to all channels
    for (
      let articleIndex = 0;
      articleIndex < newArticleEntries.length;
      articleIndex++
    ) {
      const articleEntry = newArticleEntries[articleIndex];
      console.log(
        `\n[AUTO-POST] === Processing article ${articleIndex + 1}/${newArticleEntries.length}: ${articleEntry.title} ===`,
      );

      // Rewrite and post to each channel
      for (let i = 0; i < allChannels.length; i++) {
        const channel = allChannels[i];
        const { platform, id: channelId, name } = channel;

        try {
          console.log(
            `[AUTO-POST] [${i + 1}/${allChannels.length}] Processing ${platform}/${name}...`,
          );

          // Rewrite article (generates unique content each time)
          console.log(`[AUTO-POST]   - Rewriting article for ${name}...`);
          await rewriteArticle(articleEntry.id, articleEntry.link);

          // Get the rewritten content
          const content = await findLatestContentByArticleId(articleEntry.id);

          if (!content) {
            throw new Error(`Content not found after rewriting for ${name}`);
          }

          console.log(
            `[AUTO-POST]   - Content generated: ${content.title.substring(0, 50)}...`,
          );

          // Post to channel
          const platformConfig = platformConfigs[platform];
          const platformInstance = platformFactory.create(
            platform,
            platformConfig,
          );

          let postData;

          if (platform === "facebook") {
            const formattedHashtags =
              content.hashtags
                ?.map((tag) => {
                  const cleanTag = tag.trim();
                  return cleanTag.startsWith("#") ? cleanTag : `#${cleanTag}`;
                })
                .join(" ") || "";

            const separator = "━━━━━━━━━━━━━━━━━━━━━━━";
            const message = [
              `📌 ${content.title}`,
              separator,
              "",
              content.summary,
              "",
              content.content,
              "",
              `Nguồn: ${content.source}`,
              "",
              formattedHashtags,
            ].join("\n");

            postData = {
              message: message,
              channelId: channelId,
              pageAccessToken: channel.accessToken,
              media: content.localImagePath
                ? {
                    file: {
                      path: content.localImagePath,
                    },
                  }
                : null,
            };
          } else if (platform === "shopee") {
            postData = {
              title: content.title,
              description: content.content,
              images: content.images || [],
            };
          }

          const postResult = await platformInstance.post(postData);

          result.postingResults.push({
            platform,
            channelId,
            channelName: name,
            success: true,
            postId: postResult.id || postResult.postId,
            contentTitle: content.title,
            articleId: articleEntry.id,
          });

          console.log(`[AUTO-POST]   ✅ Posted successfully to ${name}`);
        } catch (error) {
          console.error(
            `[AUTO-POST]   ❌ Error posting to ${platform}/${name}:`,
            error.message,
          );
          result.errors.push({
            platform,
            channelId,
            channelName: name,
            error: error.message,
            articleId: articleEntry.id,
          });
          result.postingResults.push({
            platform,
            channelId,
            channelName: name,
            success: false,
            error: error.message,
            articleId: articleEntry.id,
          });
        }
      }

      // Update article status
      if (
        result.postingResults.some(
          (r) => r.success && r.articleId === articleEntry.id,
        )
      ) {
        articleEntry.status = "posted";
      }
    }

    // Write updated articles with status
    await writeArticles(updatedArticles);

    result.success = true;
    console.log("\n[AUTO-POST] ========== Summary ==========");
    console.log(`📰 Selected articles: ${newArticleEntries.length}`);
    newArticleEntries.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. ${entry.title || entry.link}`);
    });
    console.log(`📝 Total channels: ${allChannels.length}`);
    console.log(
      `✅ Successful posts: ${result.postingResults.filter((r) => r.success).length}`,
    );
    console.log(
      `❌ Failed posts: ${result.postingResults.filter((r) => !r.success).length}`,
    );
    console.log("[AUTO-POST] ========== Completed ==========\n");

    return result;
  } catch (error) {
    console.error("[AUTO-POST] Fatal error:", error.message);
    result.errors.push(error.message);
    return result;
  }
}

module.exports = {
  crawlSelectAndAutoPost,
};
