import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useUserAuth } from './UserAuthContext';

const WishlistContext = createContext(null);
const KEY = 'ksr_wishlist';

export function WishlistProvider({ children }) {
  const { user } = useUserAuth();
  const storageKey = user?.userId ? `${KEY}_${user.userId}` : KEY;

  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || []; } catch { return []; }
  });

  // Reload when user changes
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(storageKey)) || []); } catch { setItems([]); }
  }, [storageKey]);

  const persist = (next) => {
    setItems(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const toggle = useCallback((product) => {
    setItems(prev => {
      const exists = prev.some(p => p.id === product.id);
      const next = exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const isWishlisted = useCallback((id) => items.some(p => p.id === id), [items]);

  const remove = useCallback((id) => {
    persist(items.filter(p => p.id !== id));
  }, [items, storageKey]);

  return (
    <WishlistContext.Provider value={{ items, toggle, isWishlisted, remove, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
