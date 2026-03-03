const { refreshFacebookToken } = require("../utils/refreshFacebookToken");
const { getFacebookConfig } = require("../utils/facebookConfig");

/**
 * Refresh Facebook access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { shortLivedToken } = req.body;

    console.log("[TOKEN] Starting token refresh...");

    const result = await refreshFacebookToken(shortLivedToken);

    res.json({
      success: true,
      message:
        "Token refreshed successfully. Configuration updated automatically.",
      data: {
        pageId: result.pageId,
        pageName: result.pageName,
        userId: result.userId,
        userName: result.userName,
        tokenPreview: result.token.substring(0, 30) + "...",
        tokenType: result.tokenType,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to refresh token",
      error: error.response?.data || error.message,
    });
  }
};

/**
 * Get current token info
 */
exports.getTokenInfo = async (req, res) => {
  try {
    const axios = require("axios");
    const config = await getFacebookConfig();
    const token = config.accessToken;
    const appId = config.appId;
    const appSecret = config.appSecret;

    if (!token) {
      return res.json({
        success: true,
        data: {
          configured: false,
          message: "No token configured",
        },
      });
    }

    if (!appId || !appSecret) {
      return res.json({
        success: true,
        data: {
          configured: true,
          validated: false,
          message: "App ID and App Secret not configured",
        },
      });
    }

    // Debug token
    const debugResponse = await axios.get(
      "https://graph.facebook.com/v18.0/debug_token",
      {
        params: {
          input_token: token,
          access_token: `${appId}|${appSecret}`,
        },
      },
    );

    const tokenInfo = debugResponse.data.data;

    res.json({
      success: true,
      data: {
        configured: true,
        validated: tokenInfo.is_valid,
        appId: tokenInfo.app_id,
        userId: tokenInfo.user_id,
        expiresAt: tokenInfo.expires_at === 0 ? null : tokenInfo.expires_at,
        expiresAtReadable:
          tokenInfo.expires_at === 0
            ? "Never"
            : new Date(tokenInfo.expires_at * 1000).toISOString(),
        scopes: tokenInfo.scopes || [],
        type: tokenInfo.type,
        isPageToken: tokenInfo.type === "PAGE",
      },
    });
  } catch (error) {
    console.error("Error getting token info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get token info",
      error: error.response?.data || error.message,
    });
  }
};
