import axios from 'axios';

// In production (Vercel), these are relative paths proxied to EC2.
// In dev (localhost), they fall back to direct service ports.
const AUTH_URL    = import.meta.env.VITE_AUTH_URL    || 'http://localhost:8081/api/auth';
const PRODUCT_URL = import.meta.env.VITE_PRODUCT_URL || 'http://localhost:8082/api';
const CART_URL    = import.meta.env.VITE_CART_URL    || 'http://localhost:8083/api/cart';
const ORDER_URL   = import.meta.env.VITE_ORDER_URL   || 'http://localhost:8084/api/orders';

const TOKEN_KEY = 'user_token';
const USER_KEY  = 'user_data';

export const getToken  = () => localStorage.getItem(TOKEN_KEY);
export const getUser   = () => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } };
export const setAuth   = (data) => { localStorage.setItem(TOKEN_KEY, data.token); localStorage.setItem(USER_KEY, JSON.stringify(data)); };
export const clearAuth = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); };

const withAuth = (config = {}) => {
  const token = getToken();
  return token ? { ...config, headers: { ...config.headers, Authorization: `Bearer ${token}` } } : config;
};

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp:    (email)        => axios.post(`${AUTH_URL}/send-otp`, { email }),
  verifyOtp:  (email, otp)   => axios.post(`${AUTH_URL}/verify-otp`, { email, otp }),
  getProfile: (userId)       => axios.get(`${AUTH_URL}/profile/${userId}`, withAuth()),
  saveProfile:(userId, data) => axios.put(`${AUTH_URL}/profile/${userId}`, data, withAuth()),
  validate:   (token)        => axios.post(`${AUTH_URL}/validate`, { token }),
};

// ── Products ──────────────────────────────────────────────────────────────
export const productApi = {
  getAll:        ()      => axios.get(`${PRODUCT_URL}/products`),
  getById:       (id)    => axios.get(`${PRODUCT_URL}/products/${id}`),
  getByCategory: (catId) => axios.get(`${PRODUCT_URL}/products/category/${catId}`),
  getByType:     (type)  => axios.get(`${PRODUCT_URL}/products/type/${type}`),
  search:        (q)     => axios.get(`${PRODUCT_URL}/products/search?q=${encodeURIComponent(q)}`),
  getVariants:   (pid)   => axios.get(`${PRODUCT_URL}/products/${pid}/variants`),
  getBenefits:   (pid)   => axios.get(`${PRODUCT_URL}/benefits/product/${pid}`),
};

// ── Categories ────────────────────────────────────────────────────────────
export const categoryApi = {
  getAll: () => axios.get(`${PRODUCT_URL}/categories`),
};

// ── Banners ───────────────────────────────────────────────────────────────
export const bannerApi = {
  getActive: () => axios.get(`${PRODUCT_URL}/banners`),
};

// ── Cart ──────────────────────────────────────────────────────────────────
export const cartApi = {
  get:    (userId)                                     => axios.get(`${CART_URL}/${userId}`, withAuth()),
  add:    (userId, productId, qty, price, productName) => axios.post(`${CART_URL}/add`, { userId, productId, quantity: qty, price, productName }, withAuth()),
  update: (userId, productId, qty)                     => axios.put(`${CART_URL}/update`, { userId, productId, quantity: qty }, withAuth()),
  remove: (userId, productId)                          => axios.delete(`${CART_URL}/${userId}/${productId}`, withAuth()),
  clear:  (userId)                                     => axios.delete(`${CART_URL}/clear/${userId}`, withAuth()),
  total:  (userId)                                     => axios.get(`${CART_URL}/total/${userId}`, withAuth()),
};

// ── Orders ────────────────────────────────────────────────────────────────
export const orderApi = {
  place:      (data) => axios.post(`${ORDER_URL}`, data, withAuth()),
  getMyOrders:(uid)  => axios.get(`${ORDER_URL}/my?userId=${uid}`, withAuth()),
  getById:    (id)   => axios.get(`${ORDER_URL}/${id}`, withAuth()),
};

// ── Misc ──────────────────────────────────────────────────────────────────
export const miscApi = {
  getHelp:        () => axios.get(`${PRODUCT_URL}/help`),
  getAbout:       () => axios.get(`${PRODUCT_URL}/about`),
  getPaySettings: () => axios.get(`${PRODUCT_URL}/payment-settings`),
};
