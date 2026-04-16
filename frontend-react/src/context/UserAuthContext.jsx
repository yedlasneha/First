import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getUser, getToken, setAuth, clearAuth, authApi } from '../api/services';

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user,    setUser]    = useState(getUser);
  const [loading, setLoading] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const token = getToken();
    if (!token || !user) return;
    authApi.validate(token)
      .then(r => { if (!r.data?.valid) { clearAuth(); setUser(null); } })
      .catch(() => { clearAuth(); setUser(null); });
  }, []);

  const login = useCallback((data) => {
    setAuth(data);
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const r = await authApi.getProfile(user.userId);
      const updated = { ...user, ...r.data };
      localStorage.setItem('user_data', JSON.stringify(updated));
      setUser(updated);
    } catch {}
  }, [user]);

  return (
    <UserAuthContext.Provider value={{ user, loading, setLoading, login, logout, refreshProfile, isLoggedIn: !!user }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export const useUserAuth = () => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within UserAuthProvider');
  return ctx;
};
