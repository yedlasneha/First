import { useState, useRef } from 'react';
import { MapPin, Navigation, Search, X, AlertCircle } from 'lucide-react';
import { useLocation2, getDistanceKm, WARANGAL } from '../context/LocationContext';

// Simple geocode search via Nominatim
async function geocodeSearch(q) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=en&countrycodes=in`
    );
    return await r.json();
  } catch { return []; }
}

export default function LocationModal() {
  const { showModal, setShowModal, requestLocation, setManual, denied, loading } = useLocation2();
  const [searchQ,   setSearchQ]   = useState('');
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  if (!showModal) return null;

  const handleSearch = (val) => {
    setSearchQ(val);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const list = await geocodeSearch(val);
      setResults(list.slice(0, 5));
      setSearching(false);
    }, 400);
  };

  const pickResult = (r) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const label = r.address?.suburb || r.address?.neighbourhood ||
      r.address?.village || r.address?.town || r.address?.city ||
      r.display_name.split(',')[0];
    setManual(label, lat, lng);
    setShowModal(false);
    setSearchQ(''); setResults([]);
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-pop-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 dark:text-white text-base">Set your location</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">For accurate delivery estimates</p>
            </div>
          </div>
          <button onClick={() => setShowModal(false)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 pb-6 flex flex-col gap-3">
          {/* Use GPS button */}
          <button
            onClick={requestLocation}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-2xl font-bold transition-all active:scale-95">
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
            ) : (
              <Navigation className="w-5 h-5 shrink-0" />
            )}
            <div className="text-left">
              <p className="text-sm font-bold">{loading ? 'Detecting your location…' : 'Use my current location'}</p>
              <p className="text-xs text-green-100 font-normal">Enable GPS for live tracking</p>
            </div>
          </button>

          {/* Permission denied warning */}
          {denied && (
            <div className="flex items-start gap-2.5 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
              <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Location permission denied</p>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-0.5">
                  Please allow location in your browser settings, then tap "Use my current location" again.
                  <br />Or search for your area below.
                </p>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 font-medium">or search manually</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Manual search */}
          <div className="relative">
            <div className="flex items-center bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2.5 gap-2 focus-within:border-green-500 transition-all">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                autoFocus={denied}
                value={searchQ}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search area, city, pincode…"
                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 dark:text-white"
              />
              {searching && <span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin shrink-0" />}
              {searchQ && !searching && (
                <button onClick={() => { setSearchQ(''); setResults([]); }}
                  className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search results */}
            {results.length > 0 && (
              <div className="mt-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden">
                {results.map((r, i) => {
                  const lat = parseFloat(r.lat);
                  const lng = parseFloat(r.lon);
                  const distKm = Math.round(getDistanceKm(lat, lng, WARANGAL.lat, WARANGAL.lng));
                  const inZone = distKm <= 150;
                  return (
                    <button key={i} onClick={() => pickResult(r)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                          {r.display_name.split(',').slice(0, 2).join(', ')}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{r.display_name.split(',').slice(2, 4).join(', ')}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${inZone ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                        {distKm} km
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delivery zone info */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <span className="text-base shrink-0">⚡</span>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              <span className="font-bold">Fast delivery</span> available Tri cities and Near Areas villages to Warangal .
              Bulk orders can be delivered anywhere.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
