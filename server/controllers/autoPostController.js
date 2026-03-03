const autoPost = require("../flows/auto-post");

/**
 * Get auto-post configuration and status
 */
exports.getStatus = async (req, res) => {
  try {
    const config = await autoPost.readConfig();
    const status = autoPost.getStatus();

    res.json({
      success: true,
      data: {
        ...config,
        schedulerRunning: status.running,
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
 * Get auto-post configuration
 */
exports.getConfig = async (req, res) => {
  try {
    const config = await autoPost.readConfig();

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Error getting auto-post config:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy cấu hình auto-post",
      error: error.message,
    });
  }
};

/**
 * Update auto-post configuration
 */
exports.updateConfig = async (req, res) => {
  try {
    const { channels, intervalMinutes } = req.body;

    // Validate inputs
    if (!channels || !Array.isArray(channels)) {
      return res.status(400).json({
        success: false,
        message: "channels phải là một mảng",
      });
    }

    if (intervalMinutes && (isNaN(intervalMinutes) || intervalMinutes <= 0)) {
      return res.status(400).json({
        success: false,
        message: "intervalMinutes phải là số dương",
      });
    }

    // Read current config
    const config = await autoPost.readConfig();

    // Update config
    config.channels = channels;
    if (intervalMinutes) {
      config.intervalMinutes = intervalMinutes;
    }

    await autoPost.writeConfig(config);

    // Restart scheduler if it was running
    if (config.enabled) {
      autoPost.stopScheduler();
      await autoPost.startScheduler();
    }

    res.json({
      success: true,
      message: "Cập nhật cấu hình thành công",
      data: config,
    });
  } catch (error) {
    console.error("Error updating auto-post config:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật cấu hình",
      error: error.message,
    });
  }
};

/**
 * Enable auto-posting
 */
exports.enable = async (req, res) => {
  try {
    const config = await autoPost.readConfig();

    // Validate configuration
    if (!config.channels || config.channels.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cấu hình kênh đăng bài trước khi bật auto-post",
      });
    }

    config.enabled = true;
    await autoPost.writeConfig(config);
    await autoPost.startScheduler();

    res.json({
      success: true,
      message: "Đã bật auto-post",
      data: config,
    });
  } catch (error) {
    console.error("Error enabling auto-post:", error);
    res.status(500).json({
      success: false,
      message: "Không thể bật auto-post",
      error: error.message,
    });
  }
};

/**
 * Disable auto-posting
 */
exports.disable = async (req, res) => {
  try {
    const config = await autoPost.readConfig();
    config.enabled = false;
    await autoPost.writeConfig(config);
    autoPost.stopScheduler();

    res.json({
      success: true,
      message: "Đã tắt auto-post",
      data: config,
    });
  } catch (error) {
    console.error("Error disabling auto-post:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tắt auto-post",
      error: error.message,
    });
  }
};

/**
 * Manually trigger auto-post job
 */
exports.runNow = async (req, res) => {
  try {
    // Run job in background
    autoPost.executeAutoPost().catch((err) => {
      console.error("Error in manual auto-post execution:", err);
    });

    res.json({
      success: true,
      message: "Đã kích hoạt auto-post thủ công",
    });
  } catch (error) {
    console.error("Error triggering auto-post:", error);
    res.status(500).json({
      success: false,
      message: "Không thể kích hoạt auto-post",
      error: error.message,
    });
  }
};

/**
 * Get auto-post history
 */
exports.getHistory = async (req, res) => {
  try {
    const history = await autoPost.readHistory();

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error getting auto-post history:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy lịch sử auto-post",
      error: error.message,
    });
  }
};
