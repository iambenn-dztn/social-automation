/**
 * Platform Factory
 * Central registry for all platform integrations
 */

const FacebookPlatform = require('./facebook/FacebookPlatform');
const ShopeePlatform = require('./shopee/ShopeePlatform');

class PlatformFactory {
  constructor() {
    this.platforms = new Map();
    this.registerDefaultPlatforms();
  }

  /**
   * Register default platforms
   */
  registerDefaultPlatforms() {
    this.register('facebook', FacebookPlatform);
    this.register('shopee', ShopeePlatform);
  }

  /**
   * Register a new platform
   * @param {string} name - Platform name (lowercase)
   * @param {Class} PlatformClass - Platform class that extends BasePlatform
   */
  register(name, PlatformClass) {
    this.platforms.set(name.toLowerCase(), PlatformClass);
    console.log(`✅ Platform registered: ${name}`);
  }

  /**
   * Create platform instance
   * @param {string} name - Platform name
   * @param {Object} config - Platform configuration
   * @returns {BasePlatform} Platform instance
   */
  create(name, config) {
    const PlatformClass = this.platforms.get(name.toLowerCase());
    
    if (!PlatformClass) {
      throw new Error(`Platform "${name}" is not registered. Available platforms: ${this.getAvailablePlatforms().join(', ')}`);
    }

    return new PlatformClass(config);
  }

  /**
   * Get all available platforms
   * @returns {Array<string>} Platform names
   */
  getAvailablePlatforms() {
    return Array.from(this.platforms.keys());
  }

  /**
   * Get platform configuration schema
   * @param {string} name - Platform name
   * @returns {Object} Configuration schema
   */
  getConfigSchema(name) {
    const PlatformClass = this.platforms.get(name.toLowerCase());
    
    if (!PlatformClass) {
      throw new Error(`Platform "${name}" is not registered`);
    }

    return PlatformClass.getConfigSchema();
  }

  /**
   * Get all platform schemas
   * @returns {Array<Object>} All platform schemas
   */
  getAllSchemas() {
    const schemas = [];
    
    for (const [name, PlatformClass] of this.platforms) {
      schemas.push({
        platform: name,
        ...PlatformClass.getConfigSchema()
      });
    }

    return schemas;
  }
}

// Export singleton instance
const factory = new PlatformFactory();

module.exports = factory;
