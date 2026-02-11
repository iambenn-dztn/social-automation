const platformFactory = require('../platforms');
const fs = require('fs');

// Store posting history (in production, use database)
let postingHistory = [];

/**
 * Get available platforms and their schemas
 */
exports.getPlatforms = (req, res) => {
  try {
    const schemas = platformFactory.getAllSchemas();
    
    res.json({
      success: true,
      platforms: schemas
    });
  } catch (error) {
    console.error('Error getting platforms:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
};

/**
 * Get channels for specific platform(s)
 */
exports.getChannels = async (req, res) => {
  try {
    const { platforms } = req.query; // Comma-separated platform names or 'all'
    const results = {};

    // Get configuration from environment
    const configs = {
      facebook: {
        accessToken: process.env.FACEBOOK_ACCESS_TOKEN
      },
      shopee: {
        partnerId: process.env.SHOPEE_PARTNER_ID,
        partnerKey: process.env.SHOPEE_PARTNER_KEY,
        shopId: process.env.SHOPEE_SHOP_ID
      }
    };

    // Determine which platforms to fetch
    const platformsToFetch = platforms === 'all' || !platforms
      ? ['facebook', 'shopee']
      : platforms.split(',').map(p => p.trim().toLowerCase());

    // Fetch channels from each platform
    for (const platformName of platformsToFetch) {
      try {
        const config = configs[platformName];
        
        // Skip if not configured
        if (!config || Object.values(config).some(v => !v)) {
          results[platformName] = {
            success: false,
            error: `${platformName} is not configured`,
            channels: []
          };
          continue;
        }

        const platform = platformFactory.create(platformName, config);
        const channels = await platform.getChannels();

        results[platformName] = {
          success: true,
          channels: channels
        };
      } catch (error) {
        console.error(`Error fetching ${platformName} channels:`, error);
        results[platformName] = {
          success: false,
          error: error.message,
          channels: []
        };
      }
    }

    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Error getting channels:', error);
    res.status(500).json({
      error: true,
      message: error.message
    });
  }
};

/**
 * Post to multiple channels across platforms
 */
exports.postToChannels = async (req, res) => {
  try {
    const { message, channels } = req.body; // channels: [{ platform, channelId, ... }]
    const mediaFile = req.file;

    if (!message) {
      return res.status(400).json({
        error: true,
        message: 'Message is required'
      });
    }

    if (!channels || channels.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'At least one channel is required'
      });
    }

    // Parse channels if string
    const channelsList = typeof channels === 'string' ? JSON.parse(channels) : channels;

    // Get configurations
    const configs = {
      facebook: {
        accessToken: process.env.FACEBOOK_ACCESS_TOKEN
      },
      shopee: {
        partnerId: process.env.SHOPEE_PARTNER_ID,
        partnerKey: process.env.SHOPEE_PARTNER_KEY,
        shopId: process.env.SHOPEE_SHOP_ID
      }
    };

    const results = [];

    // Group channels by platform for efficiency
    const channelsByPlatform = {};
    channelsList.forEach(channel => {
      if (!channelsByPlatform[channel.platform]) {
        channelsByPlatform[channel.platform] = [];
      }
      channelsByPlatform[channel.platform].push(channel);
    });

    // Post to each platform
    for (const [platformName, platformChannels] of Object.entries(channelsByPlatform)) {
      try {
        const config = configs[platformName];
        
        if (!config || Object.values(config).some(v => !v)) {
          platformChannels.forEach(channel => {
            results.push({
              platform: platformName,
              channelId: channel.channelId,
              channelName: channel.channelName || 'Unknown',
              success: false,
              error: `${platformName} is not configured`
            });
          });
          continue;
        }

        const platform = platformFactory.create(platformName, config);

        // Upload media if needed (once per platform)
        let mediaInfo = null;
        if (mediaFile && platformName === 'shopee') {
          try {
            mediaInfo = await platform.uploadMedia(mediaFile, {
              shopId: config.shopId
            });
          } catch (error) {
            console.error(`Error uploading media to ${platformName}:`, error);
          }
        }

        // Post to each channel
        for (const channel of platformChannels) {
          try {
            const postData = {
              message,
              channelId: channel.channelId,
              pageAccessToken: channel.accessToken, // For Facebook
              media: mediaFile ? { file: mediaFile, mediaId: mediaInfo?.mediaId } : null
            };

            const result = await platform.post(postData);

            results.push({
              platform: platformName,
              channelId: channel.channelId,
              channelName: channel.channelName || 'Unknown',
              success: true,
              postId: result.postId
            });
          } catch (error) {
            console.error(`Error posting to ${platformName} channel ${channel.channelId}:`, error);
            results.push({
              platform: platformName,
              channelId: channel.channelId,
              channelName: channel.channelName || 'Unknown',
              success: false,
              error: error.message
            });
          }
        }
      } catch (error) {
        console.error(`Error with platform ${platformName}:`, error);
        platformChannels.forEach(channel => {
          results.push({
            platform: platformName,
            channelId: channel.channelId,
            channelName: channel.channelName || 'Unknown',
            success: false,
            error: error.message
          });
        });
      }
    }

    // Store in history
    const historyEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: message,
      mediaFile: mediaFile ? mediaFile.filename : null,
      results: results
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
          if (err) console.error('Error deleting file:', err);
        });
      }, 5000);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Posted to ${successCount} channel(s) successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results: results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failCount
      }
    });
  } catch (error) {
    console.error('Error posting to channels:', error);

    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({
      error: true,
      message: 'Failed to post to channels',
      details: error.message
    });
  }
};

/**
 * Get posting history
 */
exports.getHistory = (req, res) => {
  res.json({
    success: true,
    history: postingHistory
  });
};
