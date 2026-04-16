import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const LocationContext = createContext(null);
const STORAGE_KEY = 'ksr_location';

export const WARANGAL = { lat: 17.9784, lng: 79.5941 };
export const FAST_DELIVERY_KM = 150;

export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function reverseGeocode(lat, lng) {
  const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  // ── Try Google Geocoding API first (accurate, fast) ──
  if (GOOGLE_KEY && GOOGLE_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
    try {
      const r = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}&language=en&result_type=sublocality|locality`
      );
      const d = await r.json();
      if (d.status === 'OK' && d.results?.length > 0) {
        // Pick the most specific component: sublocality → locality → city
        const result = d.results[0];
        const components = result.address_components || [];
        const get = (type) => components.find(c => c.types.includes(type))?.long_name;
        const label =
          get('sublocality_level_1') ||
          get('sublocality') ||
          get('neighborhood') ||
          get('locality') ||
          get('administrative_area_level_2') ||
          get('administrative_area_level_1') ||
          result.formatted_address?.split(',')[0] ||
          'Your Location';
        return label;
      }
    } catch { /* fall through to Nominatim */ }
  }

  // ── Fallback: Nominatim (OpenStreetMap) ──
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
    );
    const d = await r.json();
    const a = d.address || {};
    return (
      a.suburb || a.neighbourhood || a.quarter ||
      a.village || a.town || a.city_district ||
      a.city || a.county || a.state_district ||
      a.state || 'Your Location'
    );
  } catch { return 'Your Location'; }
}

export function LocationProvider({ children }) {
  const [location,  setLocation]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
  });
  const [loading,   setLoading]   = useState(false);
  const [denied,    setDenied]    = useState(false);
  const [showModal, setShowModal] = useState(false);
  const watchIdRef = useRef(null);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const saveLocation = useCallback((lat, lng, label) => {
    const distKm = Math.round(getDistanceKm(lat, lng, WARANGAL.lat, WARANGAL.lng));
    const loc = { lat, lng, label, distKm, manual: false, ts: Date.now() };
    setLocation(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    setLoading(false);
    setShowModal(false);
    setDenied(false);
  }, []);

  // Start GPS — getCurrentPosition first (fast), then watchPosition (live)
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setDenied(true);
      return;
    }
    stopWatch();
    setLoading(true);
    setDenied(false);

    // Step 1: get immediate fix
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const label = await reverseGeocode(lat, lng);
        saveLocation(lat, lng, label);

        // Step 2: keep watching for live updates
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (p) => {
            const label2 = await reverseGeocode(p.coords.latitude, p.coords.longitude);
            saveLocation(p.coords.latitude, p.coords.longitude, label2);
          },
          () => {}, // silent — we already have a fix
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
        );
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          // PERMISSION_DENIED
          setDenied(true);
        } else {
          // TIMEOUT or POSITION_UNAVAILABLE — try low-accuracy fallback
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude: lat, longitude: lng } = pos.coords;
              const label = await reverseGeocode(lat, lng);
              saveLocation(lat, lng, label);
            },
            () => { setDenied(true); },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [stopWatch, saveLocation]);

  // Called when user taps "Allow" in modal
  const requestLocation = useCallback(() => {
    setShowModal(false);
    startGPS();
  }, [startGPS]);

  // Manual location override
  const setManual = useCallback((label, lat = null, lng = null) => {
    stopWatch();
    const distKm = (lat && lng)
      ? Math.round(getDistanceKm(lat, lng, WARANGAL.lat, WARANGAL.lng))
      : null;
    const loc = { label, lat, lng, distKm, manual: true, ts: Date.now() };
    setLocation(loc);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  }, [stopWatch]);

  const resumeLive = useCallback(() => startGPS(), [startGPS]);

  const clear = useCallback(() => {
    stopWatch();
    setLocation(null);
    setDenied(false);
    localStorage.removeItem(STORAGE_KEY);
  }, [stopWatch]);

  // On mount
  useEffect(() => {
    const stored = location;
    if (!stored) {
      // No stored location — check if permission already granted
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(result => {
          if (result.state === 'granted') {
            // Permission already granted — start GPS silently, no modal
            startGPS();
          } else if (result.state === 'prompt') {
            // Will ask — show our modal first
            setShowModal(true);
          } else {
            // Denied
            setDenied(true);
          }
          // Listen for permission changes
          result.onchange = () => {
            if (result.state === 'granted') startGPS();
            else if (result.state === 'denied') setDenied(true);
          };
        }).catch(() => {
          // permissions API not supported — show modal
          setShowModal(true);
        });
      } else {
        setShowModal(true);
      }
    } else if (!stored.manual) {
      // Had GPS location before — resume silently
      startGPS();
    }
    return () => stopWatch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isInFastZone = location?.distKm != null ? location.distKm <= FAST_DELIVERY_KM : null;

  return (
    <LocationContext.Provider value={{
      location, loading, denied, showModal, setShowModal,
      requestLocation, setManual, resumeLive, clear,
      isInFastZone, FAST_DELIVERY_KM,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation2 = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation2 must be used within LocationProvider');
  return ctx;
};
