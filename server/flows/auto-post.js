const cron = require("node-cron");
const fs = require("fs").promises;
const path = require("path");
const {
  getPendingContents,
  updateContentStatus,
} = require("../controllers/contentController");
const platformFactory = require("../platforms");
const { getFacebookToken } = require("../utils/facebookConfig");

const CONFIG_FILE = path.join(__dirname, "../data/auto-post-config.json");
const HISTORY_FILE = path.join(__dirname, "../data/auto-post-history.json");

let cronTask = null;
let isRunning = false;

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.join(__dirname, "../data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Read config from JSON file
const readConfig = async () => {
  try {
    await ensureDataDir();
    const data = await fs.readFile(CONFIG_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      const defaultConfig = {
        enabled: false,
        channels: [],
        intervalMinutes: 60,
        lastRun: null,
      };
      await writeConfig(defaultConfig);
      return defaultConfig;
    }
    throw error;
  }
};

// Write config to JSON file
const writeConfig = async (config) => {
  await ensureDataDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
};

// Read history from JSON file
const readHistory = async () => {
  try {
    await ensureDataDir();
    const data = await fs.readFile(HISTORY_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

// Write history to JSON file
const writeHistory = async (history) => {
  await ensureDataDir();
  await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
};

// Add to history
const addToHistory = async (entry) => {
  const history = await readHistory();
  history.unshift(entry);

  // Keep only last 100 entries
  if (history.length > 100) {
    history.splice(100);
  }

  await writeHistory(history);
};

/**
 * Execute auto-post job
 */
const executeAutoPost = async () => {
  const startTime = new Date().toISOString();
  const logEntry = {
    timestamp: startTime,
    status: "running",
    content: null,
    channels: [],
    errors: [],
  };

  try {
    console.log("[AUTO-POST] Starting auto-post job...");

    // Read config
    const config = await readConfig();

    if (!config.enabled) {
      console.log("[AUTO-POST] Auto-post is disabled, skipping...");
      return;
    }

    if (!config.channels || config.channels.length === 0) {
      throw new Error("No channels configured");
    }

    // Get all pending contents
    const pendingContents = await getPendingContents();

    if (pendingContents.length === 0) {
      throw new Error("No pending contents available");
    }

    // Pick random content from pending list
    const randomContent =
      pendingContents[Math.floor(Math.random() * pendingContents.length)];

    console.log(`[AUTO-POST] Selected content: ${randomContent.title}`);
    logEntry.content = {
      id: randomContent.id,
      articleId: randomContent.articleId,
      title: randomContent.title,
    };

    // Content is already rewritten, use directly
    console.log("[AUTO-POST] Using pre-generated content");

    // Post to channels
    console.log("[AUTO-POST] Posting to channels...");

    // Get platform configs from environment
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

    // Post to each channel
    for (const channelConfig of config.channels) {
      const { platform, channelId, channelName } = channelConfig;

      try {
        const platformConfig = platformConfigs[platform.toLowerCase()];

        if (!platformConfig || Object.values(platformConfig).some((v) => !v)) {
          throw new Error(`${platform} is not configured in environment`);
        }

        const platformInstance = platformFactory.create(
          platform.toLowerCase(),
          platformConfig,
        );

        // Get channels to obtain access tokens
        const channels = await platformInstance.getChannels();
        const targetChannel = channels.find((ch) => ch.id === channelId);

        if (!targetChannel) {
          throw new Error(`Channel ${channelId} not found`);
        }

        // Prepare post data based on platform
        let postData;
        if (platform.toLowerCase() === "facebook") {
          postData = {
            message: randomContent.content,
            channelId: channelId,
            pageAccessToken: targetChannel.accessToken,
            media: randomContent.localImagePath
              ? {
                  file: {
                    path: randomContent.localImagePath,
                    filename: randomContent.localImagePath.split("/").pop(),
                  },
                }
              : null,
          };
        } else if (platform.toLowerCase() === "shopee") {
          // Upload media first for Shopee if needed
          let mediaInfo = null;
          if (randomContent.localImagePath) {
            try {
              mediaInfo = await platformInstance.uploadMedia(
                {
                  path: randomContent.localImagePath,
                  filename: randomContent.localImagePath.split("/").pop(),
                },
                { shopId: platformConfig.shopId },
              );
            } catch (error) {
              console.error(`Error uploading media to Shopee:`, error.message);
            }
          }

          postData = {
            message: randomContent.content,
            channelId: channelId,
            media: mediaInfo ? { mediaId: mediaInfo.mediaId } : null,
          };
        }

        const result = await platformInstance.post(postData);

        console.log(`[AUTO-POST] Posted to ${platform} channel ${channelName}`);

        logEntry.channels.push({
          platform,
          channelId,
          channelName,
          success: true,
          postId: result.postId,
        });
      } catch (error) {
        console.error(
          `[AUTO-POST] Error posting to ${platform} channel ${channelName}:`,
          error.message,
        );

        logEntry.channels.push({
          platform,
          channelId,
          channelName,
          success: false,
          error: error.message,
        });

        logEntry.errors.push({
          channel: channelName,
          error: error.message,
        });
      }
    }

    // Update status
    logEntry.status = logEntry.errors.length === 0 ? "success" : "partial";

    // Mark content as posted if at least one channel succeeded
    const hasSuccessfulPost = logEntry.channels.some((ch) => ch.success);
    if (hasSuccessfulPost) {
      await updateContentStatus(randomContent.id, "posted");
      console.log(`[AUTO-POST] Content marked as posted`);
    }

    // Update last run time
    config.lastRun = startTime;
    await writeConfig(config);

    console.log(`[AUTO-POST] Job completed with status: ${logEntry.status}`);
  } catch (error) {
    console.error("[AUTO-POST] Job failed:", error.message);
    logEntry.status = "failed";
    logEntry.errors.push({
      error: error.message,
    });
  } finally {
    // Save to history
    await addToHistory(logEntry);
  }
};

/**
 * Start the cron scheduler
 */
const startScheduler = async () => {
  if (isRunning) {
    console.log("[AUTO-POST] Scheduler is already running");
    return;
  }

  const config = await readConfig();

  if (!config.enabled) {
    console.log("[AUTO-POST] Auto-post is disabled");
    return;
  }

  // Stop existing task if any
  if (cronTask) {
    cronTask.stop();
  }

  // Create cron pattern based on interval
  const intervalMinutes = config.intervalMinutes || 60;

  // For intervals >= 60 minutes, use hourly cron
  // For shorter intervals, use minute-based cron
  let cronPattern;
  if (intervalMinutes >= 60) {
    const hours = Math.floor(intervalMinutes / 60);
    cronPattern = `0 */${hours} * * *`; // Every N hours
  } else {
    cronPattern = `*/${intervalMinutes} * * * *`; // Every N minutes
  }

  console.log(
    `[AUTO-POST] Starting scheduler with pattern: ${cronPattern} (every ${intervalMinutes} minutes)`,
  );

  cronTask = cron.schedule(cronPattern, executeAutoPost, {
    timezone: "Asia/Ho_Chi_Minh",
  });

  isRunning = true;
  console.log("[AUTO-POST] Scheduler started successfully");
};

/**
 * Stop the cron scheduler
 */
const stopScheduler = () => {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
  }
  isRunning = false;
  console.log("[AUTO-POST] Scheduler stopped");
};

/**
 * Get scheduler status
 */
const getStatus = () => {
  return {
    running: isRunning,
    taskActive: cronTask !== null,
  };
};

module.exports = {
  startScheduler,
  stopScheduler,
  executeAutoPost,
  getStatus,
  readConfig,
  writeConfig,
  readHistory,
};
