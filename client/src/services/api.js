import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

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

  // Get auto-post configuration
  getAutoPostConfig: () => {
    return axios.get(`${API_BASE_URL}/auto-post/config`);
  },

  // Update auto-post configuration
  updateAutoPostConfig: (data) => {
    return axios.post(`${API_BASE_URL}/auto-post/config`, data);
  },

  // Enable auto-posting
  enableAutoPost: () => {
    return axios.post(`${API_BASE_URL}/auto-post/enable`);
  },

  // Disable auto-posting
  disableAutoPost: () => {
    return axios.post(`${API_BASE_URL}/auto-post/disable`);
  },

  // Manually trigger auto-post job
  runAutoPostNow: () => {
    return axios.post(`${API_BASE_URL}/auto-post/run-now`);
  },

  // Get auto-post history
  getAutoPostHistory: () => {
    return axios.get(`${API_BASE_URL}/auto-post/history`);
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
