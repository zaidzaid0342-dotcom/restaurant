// api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'https://restaurant-1-cyf4.onrender.com/api',
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  const tabId = sessionStorage.getItem('tabId');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (tabId) config.headers['X-Tab-Id'] = tabId;
  return config;
});

// Add this to see the full error response
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Full API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default API;