import { createContext, useContext, useState, useCallback } from 'react';
import { productApi } from '../api/axios';

const BannerContext = createContext(null);

const DEFAULT_BANNERS = [
  { id: 1, imageUrl: '', title: 'Fresh Fruits Daily', subtitle: 'Farm to doorstep', tag: 'NEW', badges: ['Organic', 'Fresh'] },
];

export function BannerProvider({ children }) {
  const [banners, setBanners] = useState(DEFAULT_BANNERS);

  const fetchBanners = useCallback(async () => {
    try {
      const r = await productApi.get('/api/banners');
      if (r.data?.length) setBanners(r.data);
    } catch {}
  }, []);

  const addBanner = useCallback(async (data) => {
    const r = await productApi.post('/api/banners', data);
    setBanners(prev => [...prev, r.data]);
  }, []);

  const updateBanner = useCallback(async (id, data) => {
    const r = await productApi.put(`/api/banners/${id}`, data);
    setBanners(prev => prev.map(b => b.id === id ? r.data : b));
  }, []);

  const deleteBanner = useCallback(async (id) => {
    await productApi.delete(`/api/banners/${id}`);
    setBanners(prev => prev.filter(b => b.id !== id));
  }, []);

  const reorderBanners = useCallback((reordered) => {
    setBanners(reordered);
  }, []);

  const resetToDefault = useCallback(() => {
    setBanners(DEFAULT_BANNERS);
  }, []);

  return (
    <BannerContext.Provider value={{ banners, fetchBanners, addBanner, updateBanner, deleteBanner, reorderBanners, resetToDefault }}>
      {children}
    </BannerContext.Provider>
  );
}

export const useBanners = () => {
  const ctx = useContext(BannerContext);
  if (!ctx) throw new Error('useBanners must be used within BannerProvider');
  return ctx;
};
