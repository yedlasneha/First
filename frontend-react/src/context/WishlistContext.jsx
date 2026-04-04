import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ksr_wishlist') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('ksr_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggle = useCallback((product) => {
    setWishlist(prev => {
      const exists = prev.find(p => p.id === product.id);
      return exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
    });
  }, []);

  const isWishlisted = useCallback((id) => wishlist.some(p => p.id === id), [wishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted, count: wishlist.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) return { wishlist: [], toggle: () => {}, isWishlisted: () => false, count: 0 };
  return ctx;
};
