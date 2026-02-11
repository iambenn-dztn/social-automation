const BasePlatform = require('../base/BasePlatform');
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs');

class ShopeePlatform extends BasePlatform {
  constructor(config) {
    super('Shopee', config);
    this.partnerId = config.partnerId;
    this.partnerKey = config.partnerKey;
    this.shopId = config.shopId;
    this.baseUrl = 'https://partner.shopeemobile.com/api/v2';
    
    // Shopee Video API (if using Shopee Video)
    this.videoApiUrl = 'https://partner.shopeemobile.com/api/v2/media_space';
  }

  static getConfigSchema() {
    return {
      name: 'Shopee',
      requiredFields: [
        { name: 'partnerId', label: 'Partner ID', type: 'text' },
        { name: 'partnerKey', label: 'Partner Key', type: 'password' },
        { name: 'shopId', label: 'Shop ID', type: 'text' }
      ],
      optionalFields: [
        { name: 'accessToken', label: 'Access Token (Optional)', type: 'text' }
      ],
      documentation: 'https://open.shopee.com/documents/v2/v2.media_space.upload_video'
    };
  }

  /**
   * Generate Shopee API signature
   */
  generateSignature(path, timestamp) {
    const baseString = `${this.partnerId}${path}${timestamp}`;
    const sign = crypto
      .createHmac('sha256', this.partnerKey)
      .update(baseString)
      .digest('hex');
    return sign;
  }

  /**
   * Get common headers for Shopee API
   */
  getHeaders(path) {
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = this.generateSignature(path, timestamp);

    return {
      'Content-Type': 'application/json',
      'partner-id': this.partnerId,
      'timestamp': timestamp,
      'sign': sign
    };
  }

  async validateCredentials() {
    try {
      // Test API call to validate credentials
      const path = '/shop/get_shop_info';
      const headers = this.getHeaders(path);

      const response = await axios.post(
        `${this.baseUrl}${path}`,
        { shop_id: parseInt(this.shopId) },
        { headers }
      );

      return response.data.error === '' || response.data.error === undefined;
    } catch (error) {
      this.log('Validation failed', error.message);
      return false;
    }
  }

  async getChannels() {
    try {
      this.log('Fetching shop info');

      const path = '/shop/get_shop_info';
      const headers = this.getHeaders(path);

      const response = await axios.post(
        `${this.baseUrl}${path}`,
        { shop_id: parseInt(this.shopId) },
        { headers }
      );

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to fetch shop info');
      }

      const shopInfo = response.data.response;

      return [{
        id: this.shopId,
        name: shopInfo.shop_name || 'Shopee Shop',
        picture: shopInfo.shop_logo || null,
        platform: 'shopee',
        status: shopInfo.status || 'active'
      }];
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async uploadMedia(mediaFile, options = {}) {
    try {
      this.log('Uploading video to Shopee', { filename: mediaFile.filename });

      const path = '/media_space/upload_video';
      const timestamp = Math.floor(Date.now() / 1000);
      const sign = this.generateSignature(path, timestamp);

      // Step 1: Initialize upload
      const initResponse = await axios.post(
        `${this.baseUrl}${path}`,
        {
          shop_id: parseInt(this.shopId)
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'partner-id': this.partnerId,
            'timestamp': timestamp,
            'sign': sign
          }
        }
      );

      if (initResponse.data.error) {
        throw new Error(initResponse.data.message || 'Failed to initialize upload');
      }

      const uploadUrl = initResponse.data.response.upload_url;
      const videoId = initResponse.data.response.video_id;

      // Step 2: Upload file to the provided URL
      const formData = new FormData();
      formData.append('video', fs.createReadStream(mediaFile.path));

      await axios.post(uploadUrl, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      this.log('Video uploaded', { videoId });

      return {
        success: true,
        mediaId: videoId,
        type: 'video',
        platform: 'shopee'
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async post(postData, options = {}) {
    const { message, media } = postData;

    try {
      // For Shopee, we typically create a product or upload to Shopee Video
      // This is a simplified version - you may need to adapt based on your use case

      if (!media || !media.mediaId) {
        throw new Error('Shopee requires video upload. Please upload media first.');
      }

      // If using Shopee Video feature, update video info
      const path = '/media_space/update_video';
      const timestamp = Math.floor(Date.now() / 1000);
      const sign = this.generateSignature(path, timestamp);

      const response = await axios.post(
        `${this.baseUrl}${path}`,
        {
          shop_id: parseInt(this.shopId),
          video_id: media.mediaId,
          description: message,
          title: message.substring(0, 100) // Shopee có giới hạn title
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'partner-id': this.partnerId,
            'timestamp': timestamp,
            'sign': sign
          }
        }
      );

      if (response.data.error) {
        throw new Error(response.data.message || 'Failed to post');
      }

      this.log('Post successful', { videoId: media.mediaId });

      return {
        success: true,
        postId: media.mediaId,
        platform: 'shopee',
        channelId: this.shopId
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get video upload status
   */
  async getVideoStatus(videoId) {
    try {
      const path = '/media_space/get_video_upload_result';
      const timestamp = Math.floor(Date.now() / 1000);
      const sign = this.generateSignature(path, timestamp);

      const response = await axios.post(
        `${this.baseUrl}${path}`,
        {
          shop_id: parseInt(this.shopId),
          video_id: videoId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'partner-id': this.partnerId,
            'timestamp': timestamp,
            'sign': sign
          }
        }
      );

      return response.data.response;
    } catch (error) {
      throw this.formatError(error);
    }
  }
}

module.exports = ShopeePlatform;
