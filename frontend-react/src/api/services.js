import axios from 'axios';

// Empty string = same origin (Vercel proxies /api/* to EC2)
// In local dev, set VITE_API_BASE=http://localhost:8080 in .env.local
const BASE = import.meta.env.VITE_API_BASE ?? '';

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

export const authApi = {
  sendOtp:    (email)        => axios.post(`${BASE}/api/auth/send-otp`, { email }),
  verifyOtp:  (email, otp)   => axios.post(`${BASE}/api/auth/verify-otp`, { email, otp }),
  getProfile: (userId)       => axios.get(`${BASE}/api/auth/profile/${userId}`, withAuth()),
  saveProfile:(userId, data) => axios.put(`${BASE}/api/auth/profile/${userId}`, data, withAuth()),
  validate:   (token)        => axios.post(`${BASE}/api/auth/validate`, { token }),
};

export const productApi = {
  getAll:        ()      => axios.get(`${BASE}/api/products`),
  getById:       (id)    => axios.get(`${BASE}/api/products/${id}`),
  getByCategory: (catId) => axios.get(`${BASE}/api/products/category/${catId}`),
  getByType:     (type)  => axios.get(`${BASE}/api/products/type/${type}`),
  search:        (q)     => axios.get(`${BASE}/api/products/search?q=${encodeURIComponent(q)}`),
  getVariants:   (pid)   => axios.get(`${BASE}/api/products/${pid}/variants`),
  getBenefits:   (pid)   => axios.get(`${BASE}/api/benefits/product/${pid}`),
};

export const categoryApi = {
  getAll: () => axios.get(`${BASE}/api/categories`),
};

export const bannerApi = {
  getActive: () => axios.get(`${BASE}/api/banners`),
};

export const cartApi = {
  get:    (userId)                                     => axios.get(`${BASE}/api/cart/${userId}`, withAuth()),
  add:    (userId, productId, qty, price, productName) => axios.post(`${BASE}/api/cart/add`, { userId, productId, quantity: qty, price, productName }, withAuth()),
  update: (userId, productId, qty)                     => axios.put(`${BASE}/api/cart/update`, { userId, productId, quantity: qty }, withAuth()),
  remove: (userId, productId)                          => axios.delete(`${BASE}/api/cart/${userId}/${productId}`, withAuth()),
  clear:  (userId)                                     => axios.delete(`${BASE}/api/cart/clear/${userId}`, withAuth()),
  total:  (userId)                                     => axios.get(`${BASE}/api/cart/total/${userId}`, withAuth()),
};

export const orderApi = {
  place:       (data) => axios.post(`${BASE}/api/orders`, data, withAuth()),
  getMyOrders: (uid)  => axios.get(`${BASE}/api/orders/my?userId=${uid}`, withAuth()),
  getById:     (id)   => axios.get(`${BASE}/api/orders/${id}`, withAuth()),
};

export const miscApi = {
  getHelp:        () => axios.get(`${BASE}/api/help`),
  getAbout:       () => axios.get(`${BASE}/api/about`),
  getPaySettings: () => axios.get(`${BASE}/api/payment-settings`),
};
