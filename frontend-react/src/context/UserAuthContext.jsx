import { createContext, useContext, useState, useCallback } from 'react';
import { authApi, USER_TOKEN_KEY, USER_DATA_KEY, ADMIN_TOKEN_KEY, ADMIN_DATA_KEY } from '../api/axios';

const ADMIN_EMAIL = 'ksrfruitshelp@gmail.com';

const UserAuthContext = createContext(null);

function loadStoredUser() {
  try {
    const s = localStorage.getItem(USER_DATA_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);

  const login = useCallback((data) => {
    if (data.role === 'ADMIN') {
      // Store in admin slots too so ProtectedRoute works
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(data));
    }
    localStorage.setItem(USER_TOKEN_KEY, data.token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_DATA_KEY);
    setUser(null);
  }, []);

  // Smart sendOtp: admin email → admin endpoint, everyone else → user endpoint
  const sendOtp = async (email) => {
    const isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL;
    const endpoint = isAdmin ? '/api/auth/admin/send-otp' : '/api/auth/send-otp';
    const { data } = await authApi.post(endpoint, { email });
    return data;
  };

  // Smart verifyOtp: admin email → admin endpoint, everyone else → user endpoint
  const verifyOtp = async (email, otp) => {
    const isAdmin = email.trim().toLowerCase() === ADMIN_EMAIL;
    const endpoint = isAdmin ? '/api/auth/admin/verify-otp' : '/api/auth/verify-otp';
    const { data } = await authApi.post(endpoint, { email, otp });
    login(data);
    return data;
  };

  return (
    <UserAuthContext.Provider value={{ user, login, logout, sendOtp, verifyOtp }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export const useUserAuth = () => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) return { user: null, login: () => {}, logout: () => {}, sendOtp: async () => ({}), verifyOtp: async () => ({}) };
  return ctx;
};
