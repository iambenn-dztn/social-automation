const fs = require("fs").promises;
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const CONFIG_FILE = path.join(DATA_DIR, "facebook-config.json");
const AUTO_POST_CONFIG = path.join(DATA_DIR, "auto-post-config.json");
const AUTO_POST_HISTORY = path.join(DATA_DIR, "auto-post-history.json");

/**
 * Seed initial data on first deployment
 */
const seedData = async () => {
  console.log("[SEED] Checking and seeding initial data...");

  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, "images"), { recursive: true });
    await fs.mkdir(path.join(DATA_DIR, "output"), { recursive: true });
    console.log("[SEED] ✅ Data directories created");

    // Seed facebook-config.json
    try {
      await fs.access(CONFIG_FILE);
      console.log("[SEED] ✅ facebook-config.json already exists");
    } catch {
      const facebookConfig = {
        accessToken: process.env.FACEBOOK_ACCESS_TOKEN || "",
        appId: process.env.FACEBOOK_APP_ID || "",
        appSecret: process.env.FACEBOOK_APP_SECRET || "",
        tokenType: "USER",
        expiresAt: null,
        updatedAt: new Date().toISOString(),
      };
      await fs.writeFile(CONFIG_FILE, JSON.stringify(facebookConfig, null, 2));
      console.log("[SEED] ✅ Created facebook-config.json");
    }

    // Seed auto-post-config.json
    try {
      await fs.access(AUTO_POST_CONFIG);
      console.log("[SEED] ✅ auto-post-config.json already exists");
    } catch {
      const autoPostConfig = {
        enabled: false,
        channels: [],
        intervalMinutes: 60,
        lastRun: null,
      };
      await fs.writeFile(
        AUTO_POST_CONFIG,
        JSON.stringify(autoPostConfig, null, 2),
      );
      console.log("[SEED] ✅ Created auto-post-config.json");
    }

    // Seed auto-post-history.json
    try {
      await fs.access(AUTO_POST_HISTORY);
      console.log("[SEED] ✅ auto-post-history.json already exists");
    } catch {
      await fs.writeFile(AUTO_POST_HISTORY, JSON.stringify([], null, 2));
      console.log("[SEED] ✅ Created auto-post-history.json");
    }

    console.log("[SEED] 🎉 Data seeding completed successfully");
  } catch (error) {
    console.error("[SEED] ❌ Error seeding data:", error.message);
    throw error;
  }
};

module.exports = { seedData };
