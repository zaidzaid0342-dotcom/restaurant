import axios from 'axios';

const API = axios.create({
  baseURL: 'https://restaurant-1-cyf4.onrender.com/api',
  withCredentials: true, // important if backend sends cookies
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  const tabId = sessionStorage.getItem('tabId');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (tabId) config.headers['X-Tab-Id'] = tabId; // send your custom header
  return config;
});

export default API;
