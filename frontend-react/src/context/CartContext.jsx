import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cartApi } from '../api/axios';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // Get userId from localStorage
  const getUserId = () => {
    try {
      const d = localStorage.getItem('user_data');
      return d ? JSON.parse(d)?.userId : null;
    } catch { return null; }
  };

  // Load cart from backend when user is logged in
  const loadCart = useCallback(async () => {
    const userId = getUserId();
    if (!userId) { setCart([]); return; }
    try {
      const { data } = await cartApi.get(`/api/cart/${userId}`);
      // Map backend CartItem to local format
      setCart(Array.isArray(data) ? data.map(i => ({
        id: i.productId,
        cartItemId: i.id,
        name: i.productName,
        price: parseFloat(i.price),
        qty: i.quantity,
        imageUrl: null, // will be enriched from product list
      })) : []);
    } catch { setCart([]); }
  }, []);

  // Enrich cart items with product imageUrl
  const enrichCart = useCallback((products) => {
    setCart(prev => prev.map(item => {
      const p = products.find(p => p.id === item.id);
      return p ? { ...item, imageUrl: p.imageUrl, unit: p.unit } : item;
    }));
  }, []);

  const addToCart = useCallback(async (product) => {
    const userId = getUserId();
    // Optimistic update
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price: parseFloat(product.price), qty: 1, imageUrl: product.imageUrl, unit: product.unit }];
    });
    if (!userId) return;
    try {
      await cartApi.post('/api/cart/add', {
        userId, productId: product.id, quantity: 1,
        price: parseFloat(product.price), productName: product.name,
      });
    } catch { /* keep optimistic */ }
  }, []);

  const updateQty = useCallback(async (productId, qty) => {
    const userId = getUserId();
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.id !== productId));
      if (userId) {
        try { await cartApi.delete(`/api/cart/${userId}/${productId}`); } catch {}
      }
      return;
    }
    setCart(prev => prev.map(i => i.id === productId ? { ...i, qty } : i));
    if (!userId) return;
    try {
      await cartApi.put('/api/cart/update', { userId, productId, quantity: qty });
    } catch {}
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    const userId = getUserId();
    setCart(prev => prev.filter(i => i.id !== productId));
    if (!userId) return;
    try { await cartApi.delete(`/api/cart/${userId}/${productId}`); } catch {}
  }, []);

  const clearCart = useCallback(async () => {
    const userId = getUserId();
    setCart([]);
    if (!userId) return;
    try { await cartApi.delete(`/api/cart/clear/${userId}`); } catch {}
  }, []);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart, clearCart, total, count, loadCart, enrichCart, syncing }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) return { cart: [], addToCart: () => {}, updateQty: () => {}, removeFromCart: () => {}, clearCart: async () => {}, total: 0, count: 0, loadCart: async () => {}, enrichCart: () => {}, syncing: false };
  return ctx;
};
