import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

export const ADMIN_TOKEN_KEY = 'admin_token';
export const ADMIN_DATA_KEY  = 'admin_data';
export const USER_TOKEN_KEY  = 'user_token';
export const USER_DATA_KEY   = 'user_data';

function getToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(USER_TOKEN_KEY);
}

export const authApi = axios.create({
  baseURL: `${BASE}/api/auth`,
  headers: { 'Content-Type': 'application/json' },
});

export const productApi = axios.create({
  baseURL: `${BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

export const cartApi = axios.create({
  baseURL: `${BASE}/api/cart`,
  headers: { 'Content-Type': 'application/json' },
});

export const orderApi = axios.create({
  baseURL: `${BASE}/api/orders`,
  headers: { 'Content-Type': 'application/json' },
});

[authApi, productApi, cartApi, orderApi].forEach((instance) => {
  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_DATA_KEY);
        window.location.href = '/admin-login';
      }
      return Promise.reject(err);
    }
  );
});

export default authApi;
