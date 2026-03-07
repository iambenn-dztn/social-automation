const autoPost = require("../flows/auto-post");

/**
 * Get auto-post configuration and status
 */
exports.getStatus = async (req, res) => {
  try {
    const status = autoPost.getStatus();

    res.json({
      success: true,
      data: {
        hotCrawlerRunning: status.hotArticlesCrawlerRunning,
        hotCrawlerActive: status.hotArticlesCrawlerActive,
        config: status.config,
      },
    });
  } catch (error) {
    console.error("Error getting auto-post status:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy trạng thái auto-post",
      error: error.message,
    });
  }
};

/**
 * Get hot crawler config
 */
exports.getConfig = async (req, res) => {
  try {
    const config = await autoPost.readConfig();

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error getting hot crawler config:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy cấu hình",
      error: error.message,
    });
  }
};

/**
 * Update hot crawler config
 */
exports.updateConfig = async (req, res) => {
  try {
    const { cronPattern, articlesPerRun } = req.body;

    // Validate inputs
    if (cronPattern !== undefined) {
      const cron = require("node-cron");
      if (!cron.validate(cronPattern)) {
        return res.status(400).json({
          success: false,
          message: "Cron pattern không hợp lệ",
        });
      }
    }

    if (articlesPerRun !== undefined) {
      if (isNaN(articlesPerRun) || articlesPerRun < 1 || articlesPerRun > 10) {
        return res.status(400).json({
          success: false,
          message: "Số bài mỗi lần phải từ 1 đến 10",
        });
      }
    }

    // Read current config
    const config = await autoPost.readConfig();

    // Update config
    if (cronPattern !== undefined) {
      config.cronPattern = cronPattern;
    }
    if (articlesPerRun !== undefined) {
      config.articlesPerRun = parseInt(articlesPerRun);
    }

    await autoPost.writeConfig(config);

    // Restart crawler if it was running
    if (config.enabled) {
      await autoPost.stopHotArticlesCrawler();
      await autoPost.startHotArticlesCrawler();
    }

    res.json({
      success: true,
      message: "Cập nhật cấu hình thành công. Vui lòng khởi động lại crawler.",
      data: config,
    });
  } catch (error) {
    console.error("Error updating hot crawler config:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật cấu hình",
      error: error.message,
    });
  }
};

/**
 * Start hot articles crawler scheduler
 */
exports.startHotCrawler = async (req, res) => {
  try {
    autoPost.startHotArticlesCrawler();

    res.json({
      success: true,
      message: "Đã bật auto-post crawler (chạy mỗi 10 phút)",
    });
  } catch (error) {
    console.error("Error starting hot articles crawler:", error);
    res.status(500).json({
      success: false,
      message: "Không thể bật hot articles crawler",
      error: error.message,
    });
  }
};

/**
 * Stop hot articles crawler scheduler
 */
exports.stopHotCrawler = async (req, res) => {
  try {
    autoPost.stopHotArticlesCrawler();

    res.json({
      success: true,
      message: "Đã tắt hot articles crawler",
    });
  } catch (error) {
    console.error("Error stopping hot articles crawler:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tắt hot articles crawler",
      error: error.message,
    });
  }
};

/**
 * Manually trigger crawl-select-and-auto-post
 */
exports.crawlAndAutoPost = async (req, res) => {
  try {
    // Run job in background
    autoPost
      .crawlSelectAndAutoPost()
      .then((result) => {
        console.log("[MANUAL AUTO-POST] Completed:", result);
      })
      .catch((err) => {
        console.error("[MANUAL AUTO-POST] Error:", err);
      });

    res.json({
      success: true,
      message: "Đã bắt đầu crawl, chọn bài tốt nhất và đăng lên tất cả page",
    });
  } catch (error) {
    console.error("Error triggering crawl and auto post:", error);
    res.status(500).json({
      success: false,
      message: "Không thể bắt đầu crawl and auto post",
      error: error.message,
    });
  }
};
