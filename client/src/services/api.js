import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = {
  // Get list of fanpages
  getPages: () => {
    return axios.get(`${API_BASE_URL}/facebook/pages`);
  },

  // Post to multiple fanpages
  postToPages: (formData) => {
    return axios.post(`${API_BASE_URL}/facebook/post`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get posting history
  getHistory: () => {
    return axios.get(`${API_BASE_URL}/facebook/history`);
  },

  // Health check
  healthCheck: () => {
    return axios.get(`${API_BASE_URL}/health`);
  },
};

export default api;
