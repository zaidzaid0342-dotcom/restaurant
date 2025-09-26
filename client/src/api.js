import axios from 'axios';
const API = axios.create({ baseURL: '/api' });
API.interceptors.request.use((config) => {
  // Use sessionStorage instead of localStorage
  const token = sessionStorage.getItem('token');
  const tabId = sessionStorage.getItem('tabId');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Add tab ID to headers for server validation
    if (tabId) {
      config.headers['X-Tab-Id'] = tabId;
    }
  }
  return config;
});
export default API;