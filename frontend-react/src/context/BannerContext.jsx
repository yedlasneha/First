import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { productApi } from '../api/axios';

const BannerContext = createContext(null);

export function BannerProvider({ children }) {
  const [banners, setBanners] = useState([]);

  const fetchBanners = useCallback(async () => {
    try {
      const { data } = await productApi.get('/api/banners/all');
      setBanners(Array.isArray(data) ? data : []);
    } catch { setBanners([]); }
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  const addBanner = async (banner) => {
    const { data } = await productApi.post('/api/banners', banner);
    await fetchBanners();
    return data;
  };

  const updateBanner = async (id, banner) => {
    const { data } = await productApi.put(`/api/banners/${id}`, banner);
    await fetchBanners();
    return data;
  };

  const deleteBanner = async (id) => {
    await productApi.delete(`/api/banners/${id}`);
    await fetchBanners();
  };

  const reorderBanners = async (ordered) => {
    // Update display order for each banner
    await Promise.all(ordered.map((b, i) =>
      productApi.put(`/api/banners/${b.id}`, { ...b, displayOrder: i + 1 })
    ));
    await fetchBanners();
  };

  const resetToDefault = () => fetchBanners();

  return (
    <BannerContext.Provider value={{ banners, addBanner, updateBanner, deleteBanner, reorderBanners, resetToDefault, refetch: fetchBanners }}>
      {children}
    </BannerContext.Provider>
  );
}

export const useBanners = () => {
  const ctx = useContext(BannerContext);
  if (!ctx) return { banners: [], addBanner: async () => {}, updateBanner: async () => {}, deleteBanner: async () => {}, reorderBanners: async () => {}, resetToDefault: () => {}, refetch: async () => {} };
  return ctx;
};
