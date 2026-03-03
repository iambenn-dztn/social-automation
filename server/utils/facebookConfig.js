const fs = require("fs").promises;
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../data/facebook-config.json");

/**
 * Get Facebook configuration from JSON file
 */
async function getFacebookConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = JSON.parse(data);

    // Fallback to .env if config file is empty
    if (!config.accessToken && process.env.FACEBOOK_ACCESS_TOKEN) {
      config.accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    }

    if (!config.appId && process.env.FACEBOOK_APP_ID) {
      config.appId = process.env.FACEBOOK_APP_ID;
    }

    if (!config.appSecret && process.env.FACEBOOK_APP_SECRET) {
      config.appSecret = process.env.FACEBOOK_APP_SECRET;
    }

    return config;
  } catch (error) {
    // If file doesn't exist, create default config from .env
    const defaultConfig = {
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN || "",
      appId: process.env.FACEBOOK_APP_ID || "",
      appSecret: process.env.FACEBOOK_APP_SECRET || "",
      tokenType: "USER",
      expiresAt: null,
      lastRefreshed: null,
      pageId: null,
      pageName: null,
    };

    await saveFacebookConfig(defaultConfig);
    return defaultConfig;
  }
}

/**
 * Save Facebook configuration to JSON file
 */
async function saveFacebookConfig(config) {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(CONFIG_PATH);
    await fs.mkdir(dataDir, { recursive: true });

    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error saving Facebook config:", error);
    throw error;
  }
}

/**
 * Update specific fields in Facebook configuration
 */
async function updateFacebookConfig(updates) {
  const config = await getFacebookConfig();
  const newConfig = { ...config, ...updates };
  await saveFacebookConfig(newConfig);
  return newConfig;
}

/**
 * Get Facebook access token (shorthand)
 */
async function getFacebookToken() {
  const config = await getFacebookConfig();
  return config.accessToken;
}

module.exports = {
  getFacebookConfig,
  saveFacebookConfig,
  updateFacebookConfig,
  getFacebookToken,
};
