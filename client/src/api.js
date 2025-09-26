import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  const tabId = sessionStorage.getItem('tabId');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    if (tabId) config.headers['X-Tab-Id'] = tabId;
  }
  return config;
});

export default API;
