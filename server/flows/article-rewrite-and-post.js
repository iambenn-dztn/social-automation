const { rewriteArticle } = require("./rewrite-content-new");
const platformFactory = require("../platforms");
const { getFacebookToken } = require("../utils/facebookConfig");
const fs = require("fs").promises;
const path = require("path");

/**
 * Rewrite article and post to all connected channels
 * @param {string} articleId - Article ID
 * @param {string} url - Article URL
 * @returns {Promise<object>} - Result with content and posting status
 */
async function rewriteAndPostToAllChannels(articleId, url) {
  const result = {
    success: false,
    articleId,
    url,
    content: null,
    postingResults: [],
    errors: [],
  };

  try {
    console.log(
      `[REWRITE+POST] Starting rewrite and post for article: ${articleId}`,
    );

    // Step 1: Rewrite article (saves to file)
    console.log("[REWRITE+POST] Step 1/3: Rewriting article...");
    await rewriteArticle(articleId, url);

    // Step 2: Read the saved content
    console.log("[REWRITE+POST] Step 2/3: Reading saved content...");
    const content = await findLatestContentByArticleId(articleId);

    if (!content) {
      throw new Error("Content not found after rewriting");
    }

    result.content = content;
    console.log(
      `[REWRITE+POST] Content found: ${content.title.substring(0, 50)}...`,
    );

    // Step 3: Get all connected channels and post
    console.log("[REWRITE+POST] Step 3/3: Posting to all channels...");

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

    // Get channels from all platforms
    const allChannels = [];

    for (const [platformName, config] of Object.entries(platformConfigs)) {
      try {
        // Skip if not configured
        if (!config || Object.values(config).some((v) => !v)) {
          console.log(
            `[REWRITE+POST] ${platformName} not configured, skipping...`,
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
          `[REWRITE+POST] Found ${channels.length} ${platformName} channels`,
        );
      } catch (error) {
        console.error(
          `[REWRITE+POST] Error getting ${platformName} channels:`,
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

    console.log(`[REWRITE+POST] Total channels to post: ${allChannels.length}`);

    // Post to each channel
    for (const channel of allChannels) {
      const { platform, id: channelId, name, accessToken } = channel;

      try {
        const platformConfig = platformConfigs[platform];
        const platformInstance = platformFactory.create(
          platform,
          platformConfig,
        );

        // Prepare post data based on platform
        let postData;

        if (platform === "facebook") {
          // Format hashtags with # prefix
          const formattedHashtags =
            content.hashtags
              ?.map((tag) => {
                const cleanTag = tag.trim();
                return cleanTag.startsWith("#") ? cleanTag : `#${cleanTag}`;
              })
              .join(" ") || "";

          // Format message giống PostManagement: Title, Summary, Content, Source, Hashtags
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
            pageAccessToken: accessToken,
            media: content.localImagePath
              ? {
                  file: {
                    path: content.localImagePath,
                    filename: content.localImagePath.split("/").pop(),
                  },
                }
              : null,
          };
        } else if (platform === "shopee") {
          // Format message giống Facebook
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

          // Upload media first for Shopee if needed
          let mediaInfo = null;
          if (content.localImagePath) {
            try {
              mediaInfo = await platformInstance.uploadMedia(
                {
                  path: content.localImagePath,
                  filename: content.localImagePath.split("/").pop(),
                },
                { shopId: platformConfig.shopId },
              );
            } catch (error) {
              console.error(
                `[REWRITE+POST] Error uploading media to Shopee:`,
                error.message,
              );
            }
          }

          postData = {
            message: message,
            channelId: channelId,
            media: mediaInfo ? { mediaId: mediaInfo.mediaId } : null,
          };
        }

        const postResult = await platformInstance.post(postData);

        console.log(`[REWRITE+POST] ✓ Posted to ${platform}: ${name}`);

        result.postingResults.push({
          platform,
          channelId,
          channelName: name,
          success: true,
          postId: postResult.postId,
        });
      } catch (error) {
        console.error(
          `[REWRITE+POST] ✗ Failed to post to ${platform} ${name}:`,
          error.message,
        );

        result.postingResults.push({
          platform,
          channelId,
          channelName: name,
          success: false,
          error: error.message,
        });

        result.errors.push({
          platform,
          channelId,
          channelName: name,
          stage: "posting",
          error: error.message,
        });
      }
    }

    // Update content status to posted if at least one channel succeeded
    const hasSuccessfulPost = result.postingResults.some((r) => r.success);
    if (hasSuccessfulPost) {
      await updateContentStatusInFile(content.articleId, "posted");
      console.log(`[REWRITE+POST] Content marked as posted`);
    }

    result.success = result.postingResults.some((r) => r.success);

    console.log(
      `[REWRITE+POST] Completed with ${result.postingResults.filter((r) => r.success).length}/${result.postingResults.length} successful posts`,
    );

    return result;
  } catch (error) {
    console.error("[REWRITE+POST] Error:", error.message);
    result.errors.push({
      stage: "general",
      error: error.message,
    });
    throw error;
  }
}

/**
 * Find latest content by article ID from output files
 * @param {string} articleId - Article ID
 * @returns {Promise<object|null>} - Content object or null
 */
async function findLatestContentByArticleId(articleId) {
  try {
    const outputDir = path.join(__dirname, "../data/output");
    const files = await fs.readdir(outputDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    // Sort by date descending (newest first)
    jsonFiles.sort().reverse();

    for (const file of jsonFiles) {
      const filePath = path.join(outputDir, file);
      const data = await fs.readFile(filePath, "utf8");
      const contents = JSON.parse(data);

      const contentArray = Array.isArray(contents) ? contents : [contents];
      const found = contentArray.find((c) => c.articleId === articleId);

      if (found) {
        return { ...found, fileName: file };
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding content:", error.message);
    return null;
  }
}

/**
 * Update content status in file
 * @param {string} articleId - Article ID
 * @param {string} status - New status
 */
async function updateContentStatusInFile(articleId, status) {
  try {
    const outputDir = path.join(__dirname, "../data/output");
    const files = await fs.readdir(outputDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    for (const file of jsonFiles) {
      const filePath = path.join(outputDir, file);
      const data = await fs.readFile(filePath, "utf8");
      let contents = JSON.parse(data);

      const contentArray = Array.isArray(contents) ? contents : [contents];
      const index = contentArray.findIndex((c) => c.articleId === articleId);

      if (index !== -1) {
        contentArray[index].status = status;
        contentArray[index].updatedAt = new Date().toISOString();

        await fs.writeFile(
          filePath,
          JSON.stringify(contentArray, null, 2),
          "utf8",
        );

        console.log(`[REWRITE+POST] Updated status to '${status}' in ${file}`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error updating content status:", error.message);
    return false;
  }
}

module.exports = {
  rewriteAndPostToAllChannels,
};
