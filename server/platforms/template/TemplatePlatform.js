const BasePlatform = require('../base/BasePlatform');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Template for creating new platform integration
 * 
 * Replace:
 * - TemplatePlatform -> YourPlatformName
 * - 'Template' -> 'YourPlatform'
 * - Implement all required methods
 */
class TemplatePlatform extends BasePlatform {
  constructor(config) {
    super('Template', config); // Change 'Template' to your platform name
    
    // Setup your platform configuration
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = 'https://api.yourplatform.com/v1';
    
    // Add any other config you need
  }

  /**
   * Define configuration schema
   * This tells the system what credentials are needed
   */
  static getConfigSchema() {
    return {
      name: 'Your Platform Name',
      requiredFields: [
        { 
          name: 'apiKey', 
          label: 'API Key', 
          type: 'text',
          description: 'Your API key from platform settings'
        },
        { 
          name: 'apiSecret', 
          label: 'API Secret', 
          type: 'password',
          description: 'Your API secret (keep this private!)'
        }
      ],
      optionalFields: [
        {
          name: 'userId',
          label: 'User ID',
          type: 'text'
        }
      ],
      documentation: 'https://docs.yourplatform.com/api',
      permissions: [
        'post:create',
        'post:read',
        'media:upload'
      ]
    };
  }

  /**
   * Validate API credentials
   * Test if the credentials work before using them
   * 
   * @returns {Promise<boolean>} True if valid, false otherwise
   */
  async validateCredentials() {
    try {
      this.log('Validating credentials');
      
      // Make a simple API call to test credentials
      const response = await axios.get(`${this.baseUrl}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Secret': this.apiSecret
        }
      });

      // Check if response indicates success
      return response.data.valid === true;
      
    } catch (error) {
      this.log('Validation failed', error.message);
      return false;
    }
  }

  /**
   * Get list of channels/pages/accounts for this platform
   * 
   * @returns {Promise<Array>} Array of channel objects
   */
  async getChannels() {
    try {
      this.log('Fetching channels');

      // Make API call to get user's channels/pages/accounts
      const response = await axios.get(`${this.baseUrl}/user/channels`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Map platform's response to standard format
      const channels = response.data.channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        picture: channel.avatar_url || null,
        platform: 'template', // Change to your platform name
        status: channel.status || 'active',
        // Add any other relevant fields
        customField: channel.some_custom_field
      }));

      this.log('Channels fetched', { count: channels.length });
      return channels;
      
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Upload media (image/video) to platform
   * 
   * @param {Object} mediaFile - File object from multer
   * @param {string} mediaFile.path - Path to uploaded file
   * @param {string} mediaFile.filename - Original filename
   * @param {string} mediaFile.mimetype - MIME type
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result with mediaId
   */
  async uploadMedia(mediaFile, options = {}) {
    try {
      this.log('Uploading media', { filename: mediaFile.filename });

      const isVideo = /\.(mp4|mov|avi)$/i.test(mediaFile.filename);
      const isImage = /\.(jpg|jpeg|png|gif)$/i.test(mediaFile.filename);

      // Step 1: Request upload URL (if needed)
      const initResponse = await axios.post(
        `${this.baseUrl}/media/init`,
        {
          type: isVideo ? 'video' : 'image',
          filename: mediaFile.filename,
          size: fs.statSync(mediaFile.path).size
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const uploadUrl = initResponse.data.upload_url;
      const mediaId = initResponse.data.media_id;

      // Step 2: Upload file to the provided URL
      const formData = new FormData();
      formData.append('file', fs.createReadStream(mediaFile.path));
      formData.append('media_id', mediaId);

      await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          this.log('Upload progress', { percent: percentCompleted });
        }
      });

      // Step 3: Finalize upload (if needed)
      await axios.post(
        `${this.baseUrl}/media/finalize`,
        { media_id: mediaId },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.log('Media uploaded', { mediaId });

      return {
        success: true,
        mediaId: mediaId,
        type: isVideo ? 'video' : 'image',
        platform: 'template',
        url: initResponse.data.media_url
      };
      
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Post content to platform
   * 
   * @param {Object} postData - Post data
   * @param {string} postData.message - Post message/caption
   * @param {string} postData.channelId - Channel/Page ID to post to
   * @param {Object} postData.media - Media info (if uploaded)
   * @param {string} postData.media.mediaId - Uploaded media ID
   * @param {Object} options - Additional posting options
   * @returns {Promise<Object>} Post result
   */
  async post(postData, options = {}) {
    const { message, channelId, media } = postData;

    try {
      this.log('Creating post', { channelId });

      // Prepare post payload
      const payload = {
        channel_id: channelId,
        content: message,
        // Include media if uploaded
        ...(media && media.mediaId && {
          media_id: media.mediaId,
          media_type: media.type
        }),
        // Add any other required fields
        visibility: options.visibility || 'public',
        schedule_time: options.scheduleTime || null
      };

      // Make API call to create post
      const response = await axios.post(
        `${this.baseUrl}/posts/create`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const postId = response.data.post_id;
      
      this.log('Post created', { postId, channelId });

      return {
        success: true,
        postId: postId,
        platform: 'template',
        channelId: channelId,
        url: response.data.post_url || null
      };
      
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Optional: Get post status
   * Useful for checking if post is published, pending, etc.
   */
  async getPostStatus(postId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/posts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return {
        status: response.data.status, // 'published', 'pending', 'failed'
        views: response.data.view_count,
        likes: response.data.like_count
      };
      
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Optional: Delete post
   * Useful for cleanup or managing content
   */
  async deletePost(postId) {
    try {
      await axios.delete(
        `${this.baseUrl}/posts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      this.log('Post deleted', { postId });
      return { success: true };
      
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Optional: Helper method to handle rate limiting
   */
  async handleRateLimit(error) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      this.log('Rate limited', { retryAfter });
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return true; // Indicate should retry
    }
    return false;
  }

  /**
   * Optional: Get platform-specific analytics
   */
  async getAnalytics(channelId, options = {}) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/analytics/channel/${channelId}`,
        {
          params: {
            start_date: options.startDate,
            end_date: options.endDate,
            metrics: options.metrics?.join(',')
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data;
      
    } catch (error) {
      throw this.formatError(error);
    }
  }
}

module.exports = TemplatePlatform;

/**
 * USAGE EXAMPLE:
 * 
 * // 1. Register in platforms/index.js:
 * const TemplatePlatform = require('./template/TemplatePlatform');
 * this.register('template', TemplatePlatform);
 * 
 * // 2. Add to .env:
 * TEMPLATE_API_KEY=your_api_key
 * TEMPLATE_API_SECRET=your_secret
 * 
 * // 3. Add to platformController.js:
 * const configs = {
 *   template: {
 *     apiKey: process.env.TEMPLATE_API_KEY,
 *     apiSecret: process.env.TEMPLATE_API_SECRET
 *   }
 * };
 * 
 * // 4. Use it!
 * const platform = platformFactory.create('template', config);
 * const channels = await platform.getChannels();
 * await platform.post({ message: 'Hello', channelId: '123' });
 */
