/**
 * Base Platform Class
 * All platform integrations should extend this class
 */
class BasePlatform {
  constructor(name, config) {
    if (this.constructor === BasePlatform) {
      throw new Error('BasePlatform is an abstract class and cannot be instantiated directly');
    }
    this.name = name;
    this.config = config;
  }

  /**
   * Get list of channels/pages/shops for this platform
   * @returns {Promise<Array>} List of channels
   */
  async getChannels() {
    throw new Error('Method getChannels() must be implemented');
  }

  /**
   * Upload media to platform
   * @param {Object} mediaFile - File object from multer
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result with media ID/URL
   */
  async uploadMedia(mediaFile, options = {}) {
    throw new Error('Method uploadMedia() must be implemented');
  }

  /**
   * Post content to platform
   * @param {Object} postData - Post data
   * @param {string} postData.message - Post message/description
   * @param {string} postData.channelId - Channel/Page/Shop ID
   * @param {Object} postData.media - Media information (if uploaded)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Post result
   */
  async post(postData, options = {}) {
    throw new Error('Method post() must be implemented');
  }

  /**
   * Validate credentials/access token
   * @returns {Promise<boolean>} True if valid
   */
  async validateCredentials() {
    throw new Error('Method validateCredentials() must be implemented');
  }

  /**
   * Get platform-specific configuration requirements
   * @returns {Object} Configuration schema
   */
  static getConfigSchema() {
    return {
      name: 'Base Platform',
      requiredFields: [],
      optionalFields: []
    };
  }

  /**
   * Format error message
   * @param {Error} error - Original error
   * @returns {Object} Formatted error object
   */
  formatError(error) {
    return {
      platform: this.name,
      error: true,
      message: error.message || 'Unknown error occurred',
      details: error.response?.data || error.toString()
    };
  }

  /**
   * Log activity
   * @param {string} action - Action performed
   * @param {Object} data - Activity data
   */
  log(action, data = {}) {
    console.log(`[${this.name}] ${action}:`, data);
  }
}

module.exports = BasePlatform;
