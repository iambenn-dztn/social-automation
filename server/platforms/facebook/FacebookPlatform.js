const BasePlatform = require('../base/BasePlatform');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class FacebookPlatform extends BasePlatform {
  constructor(config) {
    super('Facebook', config);
    this.apiVersion = 'v18.0';
    this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
    this.accessToken = config.accessToken;
  }

  static getConfigSchema() {
    return {
      name: 'Facebook',
      requiredFields: [
        { name: 'accessToken', label: 'Access Token', type: 'text' }
      ],
      optionalFields: [],
      permissions: [
        'pages_manage_posts',
        'pages_read_engagement',
        'pages_show_list'
      ]
    };
  }

  async validateCredentials() {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: { access_token: this.accessToken }
      });
      return !!response.data.id;
    } catch (error) {
      this.log('Validation failed', error.message);
      return false;
    }
  }

  async getChannels() {
    try {
      this.log('Fetching pages');
      
      const response = await axios.get(`${this.baseUrl}/me/accounts`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name,access_token,picture'
        }
      });

      const channels = response.data.data.map(page => ({
        id: page.id,
        name: page.name,
        picture: page.picture?.data?.url || null,
        accessToken: page.access_token,
        platform: 'facebook'
      }));

      this.log('Pages fetched', { count: channels.length });
      return channels;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async uploadMedia(mediaFile, options = {}) {
    const { pageId, pageAccessToken } = options;
    const isVideo = /\.(mp4|mov|avi)$/i.test(mediaFile.filename);

    try {
      const formData = new FormData();
      formData.append('source', fs.createReadStream(mediaFile.path));
      formData.append('access_token', pageAccessToken);

      const endpoint = isVideo ? 
        `${this.baseUrl}/${pageId}/videos` : 
        `${this.baseUrl}/${pageId}/photos`;

      const response = await axios.post(endpoint, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return {
        success: true,
        mediaId: response.data.id,
        type: isVideo ? 'video' : 'photo'
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  async post(postData, options = {}) {
    const { message, channelId, media, pageAccessToken } = postData;

    try {
      let postId;

      if (media && media.file) {
        // Upload media first
        const isVideo = /\.(mp4|mov|avi)$/i.test(media.file.filename);
        const formData = new FormData();
        formData.append(isVideo ? 'file' : 'source', fs.createReadStream(media.file.path));
        formData.append(isVideo ? 'description' : 'message', message);
        formData.append('access_token', pageAccessToken);

        const endpoint = isVideo ? 
          `${this.baseUrl}/${channelId}/videos` : 
          `${this.baseUrl}/${channelId}/photos`;

        const response = await axios.post(endpoint, formData, {
          headers: formData.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });
        
        postId = response.data.id;
      } else {
        // Text only post
        const response = await axios.post(`${this.baseUrl}/${channelId}/feed`, {
          message: message,
          access_token: pageAccessToken
        });
        postId = response.data.id;
      }

      this.log('Post successful', { channelId, postId });

      return {
        success: true,
        postId: postId,
        platform: 'facebook',
        channelId: channelId
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }
}

module.exports = FacebookPlatform;
