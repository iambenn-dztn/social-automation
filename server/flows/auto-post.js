const cron = require("node-cron");
const fs = require("fs").promises;
const path = require("path");
const { crawlSelectAndAutoPost } = require("./crawl-and-auto-post");

const CONFIG_FILE = path.join(__dirname, "../configs/hot-crawler-config.json");

let hotArticlesCronTask = null;
let hotArticlesCronRunning = false;
let currentConfig = null;

// Ensure config directory exists
const ensureConfigDir = async () => {
  const configDir = path.join(__dirname, "../configs");
  try {
    await fs.access(configDir);
  } catch {
    await fs.mkdir(configDir, { recursive: true });
  }
};

// Read config from JSON file
const readConfig = async () => {
  try {
    await ensureConfigDir();
    const data = await fs.readFile(CONFIG_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      const defaultConfig = {
        enabled: false,
        cronPattern: "*/10 * * * *", // Every 10 minutes
        articlesPerRun: 1,
      };
      await writeConfig(defaultConfig);
      return defaultConfig;
    }
    throw error;
  }
};

// Write config to JSON file
const writeConfig = async (config) => {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
};

/**
 * Get scheduler status
 */
const getStatus = () => {
  return {
    hotArticlesCrawlerRunning: hotArticlesCronRunning,
    hotArticlesCrawlerActive: hotArticlesCronTask !== null,
    config: currentConfig,
  };
};

/**
 * Start hot articles crawler and auto-post
 */
const startHotArticlesCrawler = async () => {
  if (hotArticlesCronTask) {
    console.log("[AUTO-POST] Already running");
    return;
  }

  // Read config
  const config = await readConfig();
  currentConfig = config;

  const cronPattern = config.cronPattern || "*/10 * * * *";
  const articlesPerRun = config.articlesPerRun || 1;

  // Validate cron pattern
  if (!cron.validate(cronPattern)) {
    throw new Error(`Invalid cron pattern: ${cronPattern}`);
  }

  hotArticlesCronTask = cron.schedule(cronPattern, async () => {
    if (hotArticlesCronRunning) {
      console.log("[AUTO-POST] Previous job still running, skipping...");
      return;
    }

    hotArticlesCronRunning = true;
    console.log(
      `[AUTO-POST] Starting scheduled crawl and post at ${new Date().toLocaleString("vi-VN")}`,
    );

    try {
      const result = await crawlSelectAndAutoPost(articlesPerRun);

      if (result.success) {
        if (result.selectedArticle) {
          const successCount = result.postingResults.filter(
            (r) => r.success,
          ).length;
          console.log(
            `[AUTO-POST] ✅ Completed - Posted to ${successCount}/${result.postingResults.length} channels`,
          );
        } else {
          console.log("[AUTO-POST] ℹ️  No new articles to post");
        }
      } else {
        console.log(`[AUTO-POST] ⚠️  Completed with errors`);
      }
    } catch (error) {
      console.error("[AUTO-POST] ❌ Error during scheduled job:", error);
    } finally {
      hotArticlesCronRunning = false;
    }
  });

  hotArticlesCronTask.start();
  console.log(
    `[AUTO-POST] 🚀 Started - Cron: ${cronPattern}, Articles/run: ${articlesPerRun}`,
  );

  // Update config to enabled
  config.enabled = true;
  await writeConfig(config);

  // Run immediately on start
  setImmediate(async () => {
    console.log("[AUTO-POST] Running initial crawl and post...");
    try {
      await crawlSelectAndAutoPost(articlesPerRun);
    } catch (error) {
      console.error("[AUTO-POST] Error during initial job:", error);
    }
  });
};

/**
 * Stop hot articles crawler and auto-post
 */
const stopHotArticlesCrawler = async () => {
  if (!hotArticlesCronTask) {
    console.log("[AUTO-POST] Not running");
    return;
  }

  hotArticlesCronTask.stop();
  hotArticlesCronTask = null;
  hotArticlesCronRunning = false;
  console.log("[AUTO-POST] 🛑 Stopped");

  // Update config to disabled
  const config = await readConfig();
  config.enabled = false;
  await writeConfig(config);
};

module.exports = {
  getStatus,
  readConfig,
  writeConfig,
  startHotArticlesCrawler,
  stopHotArticlesCrawler,
  crawlSelectAndAutoPost,
};
