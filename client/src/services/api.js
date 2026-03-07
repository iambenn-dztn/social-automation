import axios from "axios";

// Auto-detect API base URL based on environment
const getApiBaseUrl = () => {
  // 1. Use explicit env var if set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Production: use relative URL (same domain as frontend)
  if (process.env.NODE_ENV === "production") {
    return "/api";
  }

  // 3. Development: use localhost backend
  return "http://localhost:3001/api";
};

const API_BASE_URL = getApiBaseUrl();

console.log(
  "[API] Base URL:",
  API_BASE_URL,
  "| Environment:",
  process.env.NODE_ENV,
);

const api = {
  // ========== Legacy Facebook-only APIs (deprecated) ==========
  // Get list of fanpages
  getPages: () => {
    return axios.get(`${API_BASE_URL}/facebook/pages`);
  },

  // Post to multiple fanpages
  postToPages: (formData) => {
    return axios.post(`${API_BASE_URL}/facebook/post`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // ========== New Multi-Platform APIs ==========
  // Get available platforms
  getPlatforms: () => {
    return axios.get(`${API_BASE_URL}/platform/platforms`);
  },

  // Get channels for platform(s)
  getChannels: (platforms = "all") => {
    return axios.get(`${API_BASE_URL}/platform/channels`, {
      params: { platforms },
    });
  },

  // Post to multiple channels across platforms
  postToChannels: (formData) => {
    return axios.post(`${API_BASE_URL}/platform/post`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Get posting history
  getHistory: () => {
    return axios.get(`${API_BASE_URL}/platform/history`);
  },

  // Health check
  healthCheck: () => {
    return axios.get(`${API_BASE_URL}/health`);
  },

  // ========== Article Management APIs ==========
  // Get all articles
  getArticles: () => {
    return axios.get(`${API_BASE_URL}/articles`);
  },

  // Add new article
  addArticle: (data) => {
    return axios.post(`${API_BASE_URL}/articles`, data);
  },

  // Update article status
  updateArticleStatus: (id, status) => {
    return axios.patch(`${API_BASE_URL}/articles/${id}/status`, { status });
  },

  // Delete article
  deleteArticle: (id) => {
    return axios.delete(`${API_BASE_URL}/articles/${id}`);
  },

  // Regenerate article content
  regenerateArticle: (id) => {
    return axios.post(`${API_BASE_URL}/articles/${id}/regenerate`);
  },

  // ========== Content Management APIs ==========
  // Get all contents
  getAllContents: () => {
    return axios.get(`${API_BASE_URL}/contents`);
  },

  // Update content
  updateContent: (id, data) => {
    return axios.put(`${API_BASE_URL}/contents/${id}`, data);
  },

  // ========== Auto-Post APIs ==========
  // Get auto-post status
  getAutoPostStatus: () => {
    return axios.get(`${API_BASE_URL}/auto-post/status`);
  },

  // Get hot crawler config
  getHotCrawlerConfig: () => {
    return axios.get(`${API_BASE_URL}/auto-post/config`);
  },

  // Update hot crawler config
  updateHotCrawlerConfig: (data) => {
    return axios.post(`${API_BASE_URL}/auto-post/config`, data);
  },

  // Hot articles crawler APIs
  startHotCrawler: () => {
    return axios.post(`${API_BASE_URL}/auto-post/hot-crawler/start`);
  },

  stopHotCrawler: () => {
    return axios.post(`${API_BASE_URL}/auto-post/hot-crawler/stop`);
  },

  crawlAndAutoPost: () => {
    return axios.post(`${API_BASE_URL}/auto-post/crawl-and-post`);
  },

  // ========== Token Management APIs ==========
  // Get Facebook token info
  getTokenInfo: () => {
    return axios.get(`${API_BASE_URL}/token/info`);
  },

  // Refresh Facebook access token
  refreshFacebookToken: (shortLivedToken = null) => {
    return axios.post(`${API_BASE_URL}/token/refresh`, {
      shortLivedToken,
    });
  },
};

export default api;
export { API_BASE_URL };
