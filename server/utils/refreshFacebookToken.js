const axios = require("axios");
const path = require("path");
const { getFacebookConfig, updateFacebookConfig } = require("./facebookConfig");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

/**
 * Refresh Facebook Access Token
 * Exchanges short-lived token for long-lived token (60 days)
 * Stores user token (not page token) for flexibility
 */
async function refreshFacebookToken(shortLivedToken = null) {
  const config = await getFacebookConfig();
  const APP_ID = config.appId || process.env.FACEBOOK_APP_ID;
  const APP_SECRET = config.appSecret || process.env.FACEBOOK_APP_SECRET;
  const CURRENT_TOKEN = shortLivedToken || config.accessToken;

  console.log("🔄 Starting Facebook token refresh...\n");

  // Validate required environment variables
  if (!APP_ID || !APP_SECRET) {
    throw new Error(
      "Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET in .env file.\n" +
        "Please add these values from https://developers.facebook.com/apps",
    );
  }

  if (!CURRENT_TOKEN) {
    throw new Error(
      "Missing FACEBOOK_ACCESS_TOKEN in .env file.\n" +
        "Please get a short-lived token from https://developers.facebook.com/tools/explorer/",
    );
  }

  console.log("📋 Configuration:");
  console.log(`   App ID: ${APP_ID}`);
  console.log(`   App Secret: ${APP_SECRET.substring(0, 10)}...`);
  console.log(`   Current Token: ${CURRENT_TOKEN.substring(0, 20)}...\n`);

  try {
    // Step 0: Check current token type
    console.log("🔄 Step 0: Checking current token type...");

    const checkResponse = await axios.get(
      "https://graph.facebook.com/v18.0/debug_token",
      {
        params: {
          input_token: CURRENT_TOKEN,
          access_token: `${APP_ID}|${APP_SECRET}`,
        },
      },
    );

    const currentTokenInfo = checkResponse.data.data;
    console.log(`   Token Type: ${currentTokenInfo.type}`);
    console.log(`   Valid: ${currentTokenInfo.is_valid}`);

    if (currentTokenInfo.type === "PAGE") {
      throw new Error(
        "Token hiện tại đã là PAGE ACCESS TOKEN (không bao giờ hết hạn).\n" +
          "Không cần refresh. Nếu muốn đổi sang Page khác hoặc thêm quyền, hãy:\n" +
          "1. Lấy SHORT-LIVED USER TOKEN mới từ: https://developers.facebook.com/tools/explorer/\n" +
          "2. Chọn permissions cần thiết (pages_show_list, pages_manage_posts, v.v.)\n" +
          "3. Generate Access Token và dùng token đó để refresh",
      );
    }

    if (!currentTokenInfo.is_valid) {
      throw new Error(
        "Token hiện tại không hợp lệ hoặc đã hết hạn.\n" +
          "Vui lòng lấy token mới từ: https://developers.facebook.com/tools/explorer/",
      );
    }

    console.log("✅ Token hợp lệ, tiếp tục refresh...\n");

    // Step 1: Exchange for long-lived token
    console.log("🔄 Step 1: Exchanging for long-lived token...");

    const exchangeResponse = await axios.get(
      "https://graph.facebook.com/v18.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: APP_ID,
          client_secret: APP_SECRET,
          fb_exchange_token: CURRENT_TOKEN,
        },
      },
    );

    const longLivedToken = exchangeResponse.data.access_token;
    const expiresIn = exchangeResponse.data.expires_in;

    console.log(`✅ Long-lived token obtained`);
    console.log(
      `   Expires in: ${expiresIn}s (~${Math.floor(expiresIn / 86400)} days)\n`,
    );

    // Step 2: Get user info
    console.log("🔄 Step 2: Getting user info...");

    const userResponse = await axios.get(
      "https://graph.facebook.com/v18.0/me",
      {
        params: {
          access_token: longLivedToken,
          fields: "id,name",
        },
      },
    );

    console.log(
      `✅ User: ${userResponse.data.name} (ID: ${userResponse.data.id})\n`,
    );

    // Step 3: Get pages info (for reference, but we store user token)
    console.log("🔄 Step 3: Getting pages info...");

    const pagesResponse = await axios.get(
      "https://graph.facebook.com/v18.0/me/accounts",
      {
        params: {
          access_token: longLivedToken,
          fields: "id,name,category",
        },
      },
    );

    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      throw new Error(
        "No pages found. Make sure your Facebook account manages at least one Page.\n" +
          "Visit https://www.facebook.com/pages/create to create a page.",
      );
    }

    // Get first page (for reference)
    const pageData = pagesResponse.data.data[0];
    const pageId = pageData.id;
    const pageName = pageData.name;
    const pageCategory = pageData.category;

    console.log(`✅ Page found:`);
    console.log(`   Name: ${pageName}`);
    console.log(`   ID: ${pageId}`);
    console.log(`   Category: ${pageCategory}\n`);

    // Step 4: Verify the long-lived user token
    console.log("🔄 Step 4: Verifying long-lived token...");

    const debugResponse = await axios.get(
      "https://graph.facebook.com/v18.0/debug_token",
      {
        params: {
          input_token: longLivedToken,
          access_token: `${APP_ID}|${APP_SECRET}`,
        },
      },
    );

    const tokenInfo = debugResponse.data.data;
    console.log(`✅ Token verified:`);
    console.log(`   Valid: ${tokenInfo.is_valid}`);
    console.log(`   Type: ${tokenInfo.type}`);
    console.log(`   App: ${tokenInfo.app_id}`);
    console.log(`   User: ${tokenInfo.user_id}`);
    console.log(
      `   Expires: ${tokenInfo.expires_at === 0 ? "Never" : new Date(tokenInfo.expires_at * 1000).toLocaleString("vi-VN")}\n`,
    );

    // Step 5: Save to JSON config file
    console.log("🔄 Step 5: Updating configuration file...");

    const newConfig = {
      accessToken: longLivedToken,
      appId: APP_ID,
      appSecret: APP_SECRET,
      tokenType: tokenInfo.type,
      expiresAt: tokenInfo.expires_at === 0 ? null : tokenInfo.expires_at,
      lastRefreshed: new Date().toISOString(),
      pageId: pageId,
      pageName: pageName,
      userId: userResponse.data.id,
      userName: userResponse.data.name,
    };

    await updateFacebookConfig(newConfig);

    console.log("✅ Configuration file updated successfully!\n");

    // Summary
    console.log("═══════════════════════════════════════");
    console.log("✅ TOKEN REFRESH COMPLETED SUCCESSFULLY");
    console.log("═══════════════════════════════════════");
    console.log(`� User: ${userResponse.data.name}`);
    console.log(`📄 Page: ${pageName} (ID: ${pageId})`);
    console.log(`🔑 Token Type: ${tokenInfo.type}`);
    console.log(`🔑 Token: ${longLivedToken.substring(0, 30)}...`);
    console.log(
      `⏰ Expires: ${tokenInfo.expires_at === 0 ? "Never" : new Date(tokenInfo.expires_at * 1000).toLocaleString("vi-VN")}`,
    );
    console.log("═══════════════════════════════════════\n");
    console.log("💡 Token đã được lưu vào: server/configs/facebook-config.json");
    console.log("⚠️  Không cần restart server, token sẽ tự động cập nhật!\n");

    return {
      success: true,
      pageId,
      pageName,
      userId: userResponse.data.id,
      userName: userResponse.data.name,
      token: longLivedToken,
      tokenType: tokenInfo.type,
      expiresAt: tokenInfo.expires_at === 0 ? null : tokenInfo.expires_at,
    };
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);

    if (error.response?.data) {
      console.error("\nAPI Response:");
      console.error(JSON.stringify(error.response.data, null, 2));
    }

    if (error.response?.data?.error?.code === 190) {
      console.error("\n💡 Token is invalid or expired. Please:");
      console.error(
        "   1. Go to https://developers.facebook.com/tools/explorer/",
      );
      console.error("   2. Select your app");
      console.error("   3. Request these permissions:");
      console.error("      - pages_show_list");
      console.error("      - pages_read_engagement");
      console.error("      - pages_manage_posts");
      console.error("   4. Click 'Generate Access Token'");
      console.error("   5. Copy the token and run refresh again\n");
    }

    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const shortLivedToken = process.argv[2]; // Allow passing token as argument

  refreshFacebookToken(shortLivedToken)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Token refresh failed");
      process.exit(1);
    });
}

module.exports = { refreshFacebookToken };
