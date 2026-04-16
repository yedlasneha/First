import axios from 'axios';

const AUTH_URL    = 'http://localhost:8081';
const PRODUCT_URL = 'http://localhost:8082';
const CART_URL    = 'http://localhost:8083';
const ORDER_URL   = 'http://localhost:8084';

export const ADMIN_TOKEN_KEY = 'admin_token';
export const ADMIN_DATA_KEY  = 'admin_data';
export const USER_TOKEN_KEY  = 'user_token';
export const USER_DATA_KEY   = 'user_data';

function getToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export const authApi = axios.create({
  baseURL: AUTH_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const productApi = axios.create({
  baseURL: PRODUCT_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

export const cartApi = axios.create({
  baseURL: CART_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const orderApi = axios.create({
  baseURL: ORDER_URL,
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
