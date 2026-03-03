const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { getFacebookToken } = require("../utils/facebookConfig");

// Store posting history in memory (in production, use a database)
let postingHistory = [];

const FACEBOOK_GRAPH_API = "https://graph.facebook.com/v18.0";

/**
 * Get list of fanpages that the user has access to
 */
exports.getPages = async (req, res) => {
  try {
    const accessToken = await getFacebookToken();

    if (!accessToken) {
      return res.status(400).json({
        error: true,
        message: "Facebook access token is not configured",
      });
    }

    const response = await axios.get(`${FACEBOOK_GRAPH_API}/me/accounts`, {
      params: {
        access_token: accessToken,
        fields: "id,name,access_token,picture",
      },
    });

    const pages = response.data.data.map((page) => ({
      id: page.id,
      name: page.name,
      picture: page.picture?.data?.url || null,
      access_token: page.access_token,
    }));

    res.json({
      success: true,
      pages: pages,
    });
  } catch (error) {
    console.error(
      "Error fetching pages:",
      error.response?.data || error.message,
    );
    res.status(500).json({
      error: true,
      message: "Failed to fetch Facebook pages",
      details: error.response?.data?.error?.message || error.message,
    });
  }
};

/**
 * Post content to multiple fanpages
 */
exports.postToPages = async (req, res) => {
  try {
    const { message, channels, pageId, link, localImagePath } = req.body;
    const mediaFile = req.file;

    if (!message) {
      return res.status(400).json({
        error: true,
        message: "Message is required",
      });
    }

    // Support both old format (pageId/pageIds) and new format (channels)
    let channelsList = [];

    if (channels) {
      // New format: channels array
      channelsList =
        typeof channels === "string" ? JSON.parse(channels) : channels;
    } else if (pageId) {
      // Old format: single pageId
      channelsList = [{ channelId: pageId, platform: "facebook" }];
    } else if (req.body.pageIds) {
      // Old format: pageIds array
      const pageIds = Array.isArray(req.body.pageIds)
        ? req.body.pageIds
        : JSON.parse(req.body.pageIds);
      channelsList = pageIds.map((id) => ({
        channelId: id,
        platform: "facebook",
      }));
    }

    if (channelsList.length === 0) {
      return res.status(400).json({
        error: true,
        message: "At least one page/channel is required",
      });
    }

    const accessToken = await getFacebookToken();

    if (!accessToken) {
      return res.status(400).json({
        error: true,
        message: "Facebook access token is not configured",
      });
    }

    // Get page access tokens
    const pagesResponse = await axios.get(`${FACEBOOK_GRAPH_API}/me/accounts`, {
      params: {
        access_token: accessToken,
        fields: "id,name,access_token",
      },
    });

    const allPages = pagesResponse.data.data;
    const results = [];

    // Post to each selected page/channel
    for (const channel of channelsList) {
      const pageId = channel.channelId || channel.pageId;

      try {
        const page = allPages.find((p) => p.id === pageId);

        if (!page) {
          results.push({
            platform: "facebook",
            channelId: pageId,
            channelName: channel.channelName || "Unknown",
            success: false,
            error: "Page not found or no access",
          });
          continue;
        }

        let postId;
        let postParams = {
          message: message,
          access_token: page.access_token,
        };

        // Add link if provided
        if (link) {
          postParams.link = link;
        }

        // Determine which image to use
        let imageToUpload = null;
        if (localImagePath && fs.existsSync(localImagePath)) {
          // Use local image from crawled data
          imageToUpload = localImagePath;
          console.log(`Using local image: ${localImagePath}`);
        } else if (mediaFile) {
          // Use uploaded media file
          imageToUpload = mediaFile.path;
          console.log(`Using uploaded file: ${mediaFile.path}`);
        }

        if (imageToUpload) {
          // Determine if it's a video or photo
          const isVideo = /\.(mp4|mov|avi)$/i.test(imageToUpload);

          if (isVideo) {
            // Upload video
            const formData = new FormData();
            formData.append("file", fs.createReadStream(imageToUpload));
            formData.append("description", message);
            formData.append("access_token", page.access_token);

            const videoResponse = await axios.post(
              `${FACEBOOK_GRAPH_API}/${pageId}/videos`,
              formData,
              {
                headers: formData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
              },
            );
            postId = videoResponse.data.id;
          } else {
            // Upload photo
            const formData = new FormData();
            formData.append("source", fs.createReadStream(imageToUpload));
            formData.append("message", message);
            formData.append("access_token", page.access_token);

            const photoResponse = await axios.post(
              `${FACEBOOK_GRAPH_API}/${pageId}/photos`,
              formData,
              {
                headers: formData.getHeaders(),
              },
            );
            postId = photoResponse.data.id;
          }
        } else {
          // Post text only (or with link)
          const response = await axios.post(
            `${FACEBOOK_GRAPH_API}/${pageId}/feed`,
            postParams,
          );
          postId = response.data.id;
        }

        results.push({
          platform: "facebook",
          channelId: page.id,
          channelName: page.name,
          success: true,
          postId: postId,
        });
      } catch (error) {
        console.error(
          `Error posting to page ${pageId}:`,
          error.response?.data || error.message,
        );
        results.push({
          platform: "facebook",
          channelId: pageId,
          channelName:
            channel.channelName ||
            allPages.find((p) => p.id === pageId)?.name ||
            "Unknown",
          success: false,
          error: error.response?.data?.error?.message || error.message,
        });
      }
    }

    // Store in history
    const historyEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: message,
      mediaFile: mediaFile ? mediaFile.filename : null,
      results: results,
    };
    postingHistory.unshift(historyEntry);

    // Keep only last 50 entries
    if (postingHistory.length > 50) {
      postingHistory = postingHistory.slice(0, 50);
    }

    // Clean up uploaded file
    if (mediaFile) {
      setTimeout(() => {
        fs.unlink(mediaFile.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }, 3001);
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    res.json({
      success: true,
      message: `Posted to ${successCount} channel(s) successfully${failCount > 0 ? `, ${failCount} failed` : ""}`,
      results: results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error(
      "Error posting to pages:",
      error.response?.data || error.message,
    );

    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    res.status(500).json({
      error: true,
      message: "Failed to post to channels",
      details: error.response?.data?.error?.message || error.message,
    });
  }
};

/**
 * Get posting history
 */
exports.getHistory = (req, res) => {
  res.json({
    success: true,
    history: postingHistory,
  });
};
