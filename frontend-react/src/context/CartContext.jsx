import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cartApi } from '../api/services';
import { useUserAuth } from './UserAuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, isLoggedIn } = useUserAuth();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn || !user?.userId) return;
    setLoading(true);
    try {
      const r = await cartApi.get(user.userId);
      setItems(r.data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [isLoggedIn, user?.userId]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addItem = useCallback(async (product, qty = 1) => {
    if (!isLoggedIn || !user?.userId) return false;
    const price = product.discountPercentage > 0
      ? product.price * (1 - product.discountPercentage / 100)
      : product.price;
    try {
      await cartApi.add(user.userId, product.id, qty, price.toFixed(2), product.name);
      await fetchCart();
      return true;
    } catch { return false; }
  }, [isLoggedIn, user?.userId, fetchCart]);

  const updateQty = useCallback(async (productId, qty) => {
    if (!user?.userId) return;
    if (qty <= 0) { await removeItem(productId); return; }
    try {
      await cartApi.update(user.userId, productId, qty);
      setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
    } catch {}
  }, [user?.userId]);

  const removeItem = useCallback(async (productId) => {
    if (!user?.userId) return;
    try {
      await cartApi.remove(user.userId, productId);
      setItems(prev => prev.filter(i => i.productId !== productId));
    } catch {}
  }, [user?.userId]);

  const clearCart = useCallback(async () => {
    if (!user?.userId) return;
    try { await cartApi.clear(user.userId); setItems([]); } catch {}
  }, [user?.userId]);

  const total    = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const count    = items.reduce((s, i) => s + i.quantity, 0);
  const getQty   = (productId) => items.find(i => i.productId === productId)?.quantity || 0;

  return (
    <CartContext.Provider value={{ items, loading, total, count, fetchCart, addItem, updateQty, removeItem, clearCart, getQty }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
