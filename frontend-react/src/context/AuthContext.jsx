import { createContext, useContext, useState, useCallback } from 'react';
import { authApi, ADMIN_TOKEN_KEY, ADMIN_DATA_KEY, USER_TOKEN_KEY, USER_DATA_KEY } from '../api/axios';

const AuthContext = createContext(null);

function loadStoredAdmin() {
  try {
    // Check dedicated admin slot first, then fall back to user slot if role=ADMIN
    const adminStored = localStorage.getItem(ADMIN_DATA_KEY);
    if (adminStored) {
      const d = JSON.parse(adminStored);
      if (d?.role === 'ADMIN') return d;
    }
    const userStored = localStorage.getItem(USER_DATA_KEY);
    if (userStored) {
      const d = JSON.parse(userStored);
      if (d?.role === 'ADMIN') return d;
    }
    return null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredAdmin);

  const login = useCallback((userData) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, userData.token);
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_DATA_KEY);
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) return { user: null, login: () => {}, logout: () => {}, isAdmin: false };
  return ctx;
};
