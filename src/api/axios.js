import axios from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL;
const baseURL = envApiUrl || (window.location.origin + '/api');

const API = axios.create({
  baseURL,
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (error) {
    localStorage.removeItem('user');
  }

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Automatically logout if token is invalid or user is not found in DB
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      // Force reload to state where user is null
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;

