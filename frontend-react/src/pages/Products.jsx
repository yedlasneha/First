import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi, categoryApi } from '../api/services';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';

// Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function findClosestMatch(query, products) {
  if (!products.length || !query) return null;
  const q = query.toLowerCase();
  let best = null, bestDist = Infinity;
  for (const p of products) {
    const firstWord = p.name.toLowerCase().split(' ')[0];
    const dist = Math.min(levenshtein(q, p.name.toLowerCase()), levenshtein(q, firstWord));
    if (dist < bestDist) { bestDist = dist; best = p; }
  }
  const threshold = Math.max(2, Math.floor(query.length * 0.4));
  return bestDist <= threshold ? best : null;
}

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price_asc',  label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
  { value: 'discount',   label: 'Best Discount' },
  { value: 'name',       label: 'Name A–Z' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products,    setProducts]    = useState([]);
  const [allProducts, setAllProducts] = useState([]); // full list for client fallback
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [sort,        setSort]        = useState('default');

  const catId  = searchParams.get('category');
  const type   = searchParams.get('type');
  // Strip punctuation and extra whitespace from query
  const qParam = (searchParams.get('q') || '').replace(/[^\w\s]/g, '').trim();

  /* Always keep a full product list for client-side fallback search */
  useEffect(() => {
    productApi.getAll()
      .then(r => setAllProducts((Array.isArray(r.data) ? r.data : []).filter(p => p.active !== false)))
      .catch(() => {});
  }, []);

  /* Fetch products based on active filter */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let results = [];

      if (qParam) {
        // 1. Try backend search first
        try {
          const r = await productApi.search(qParam);
          results = (Array.isArray(r.data) ? r.data : []).filter(p => p.active !== false);
        } catch { results = []; }

        // 2. If backend returns nothing, fall back to client-side name match
        if (results.length === 0) {
          const q = qParam.toLowerCase();
          // Fetch all if we don't have them yet
          let base = allProducts;
          if (!base.length) {
            const r = await productApi.getAll();
            base = (Array.isArray(r.data) ? r.data : []).filter(p => p.active !== false);
            setAllProducts(base);
          }
          results = base.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q)
          );
        }
      } else if (catId) {
        const r = await productApi.getByCategory(catId);
        results = (Array.isArray(r.data) ? r.data : []).filter(p => p.active !== false);
      } else if (type) {
        const r = await productApi.getByType(type);
        results = (Array.isArray(r.data) ? r.data : []).filter(p => p.active !== false);
      } else {
        const r = await productApi.getAll();
        results = (Array.isArray(r.data) ? r.data : []).filter(p => p.active !== false);
      }

      setProducts(results);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [catId, type, qParam]); // allProducts intentionally excluded to avoid loop

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    categoryApi.getAll().then(r => setCategories(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const sorted = [...products].sort((a, b) => {
    if (sort === 'price_asc')  return a.price - b.price;
    if (sort === 'price_desc') return b.price - a.price;
    if (sort === 'discount')   return (b.discountPercentage || 0) - (a.discountPercentage || 0);
    if (sort === 'name')       return a.name.localeCompare(b.name);
    return 0;
  });

  const activeLabel = qParam
    ? `Results for "${qParam}"`
    : catId
      ? categories.find(c => c.id == catId)?.name || 'Category'
      : type === 'fruit'    ? '🍎 Fresh Fruits'
      : type === 'dryfruit' ? '🥜 Dry Fruits & Nuts'
      : 'All Products';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 lg:pb-6">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-5">

        {/* ── Header: title + sort ── */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate">{activeLabel}</h1>
            {!loading && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{sorted.length} product{sorted.length !== 1 ? 's' : ''}</p>
            )}
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="shrink-0 bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-green-400 transition-all cursor-pointer shadow-sm">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* ── Filter chips ── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
          <button
            onClick={() => setSearchParams({})}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              !catId && !type && !qParam
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400'
            }`}>
            All
          </button>
          <button
            onClick={() => setSearchParams({ type: 'fruit' })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              type === 'fruit'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400'
            }`}>
            🍎 Fruits
          </button>
          <button
            onClick={() => setSearchParams({ type: 'dryfruit' })}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              type === 'dryfruit'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400'
            }`}>
            🥜 Dry Fruits
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSearchParams({ category: cat.id })}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                catId == cat.id
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400'
              }`}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── Product grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {[...Array(10)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🍎</div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              No results for "{qParam}"
            </h3>
            {/* Fuzzy suggestion on the products page */}
            {qParam && (() => {
              const fuzzy = findClosestMatch(qParam, allProducts);
              const suggestName = fuzzy ? fuzzy.name.split(' ')[0] : null;
              return suggestName && suggestName.toLowerCase() !== qParam.toLowerCase() ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
                  Did you mean{' '}
                  <button
                    onClick={() => setSearchParams({ q: suggestName })}
                    className="text-green-600 font-bold hover:underline">
                    "{suggestName}"
                  </button>?
                </p>
              ) : null;
            })()}
            <button
              onClick={() => setSearchParams({})}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all">
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {sorted.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
