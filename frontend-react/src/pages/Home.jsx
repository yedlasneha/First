import { useState, useEffect } from 'react';import { Link, useNavigate } from 'react-router-dom';
import { bannerApi, categoryApi, productApi } from '../api/services';
import BannerSlider from '../components/BannerSlider';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton, Skeleton } from '../components/Skeleton';

/* ── Circular category card ─────────────────────────────────── */
// Fruit emoji map for fallback display
const FRUIT_EMOJI = {
  apple:'🍎', banana:'🍌', mango:'🥭', orange:'🍊', grapes:'🍇',
  watermelon:'🍉', papaya:'🍈', pineapple:'🍍', strawberry:'🍓',
  pomegranate:'🍎', guava:'🍐', kiwi:'🥝', lemon:'🍋', lime:'🍋',
  coconut:'🥥', cherry:'🍒', peach:'🍑', plum:'🍑', fig:'🍑',
  almond:'🥜', cashew:'🥜', walnut:'🥜', pistachio:'🥜', raisin:'🍇',
  date:'🌴', apricot:'🍑',
};

function getFruitEmoji(name) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(FRUIT_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return '🍎';
}

function CategoryCircle({ name, imageUrl, isAll, onClick }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [imageUrl]);
  const showImg = imageUrl && !imgError;

  return (
    <button onClick={onClick}
      className="shrink-0 flex flex-col items-center gap-2 group w-16 sm:w-20">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-700
        group-hover:border-green-500 group-hover:shadow-lg group-hover:scale-105
        transition-all duration-200 bg-gray-50 dark:bg-gray-800 shadow-sm flex items-center justify-center">
        {isAll ? (
          /* Cart icon for "All" */
          <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        ) : showImg ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover"
            onError={() => setImgError(true)} />
        ) : (
          /* Fruit emoji fallback — no hardcoding, derived from name */
          <span className="text-2xl">{getFruitEmoji(name)}</span>
        )}
      </div>
      <span className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight
        group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2 w-full">
        {name}
      </span>
    </button>
  );
}

/* ── Section header ─────────────────────────────────────────── */
function SectionHeader({ emoji, title, linkTo, linkLabel = 'View all →' }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">
        <span className="text-base">{emoji}</span>
        <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <Link to={linkTo} className="text-xs text-green-600 font-semibold hover:underline">{linkLabel}</Link>
    </div>
  );
}

/* ── Home page ──────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const [banners,    setBanners]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [featured,   setFeatured]   = useState([]);
  const [loadBanner, setLoadBanner] = useState(true);
  const [loadCat,    setLoadCat]    = useState(true);
  const [loadProd,   setLoadProd]   = useState(true);

  useEffect(() => {
    bannerApi.getActive()
      .then(r => setBanners(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoadBanner(false));

    categoryApi.getAll()
      .then(r => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => setLoadCat(false));

    productApi.getAll()
      .then(r => {
        const all = (Array.isArray(r.data) ? r.data : []).filter(p => p.active !== false);
        setProducts(all);
        const disc = all.filter(p => p.discountPercentage > 0);
        setFeatured(disc.length >= 4 ? disc.slice(0, 8) : all.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoadProd(false));
  }, []);

  const fruits    = products.filter(p => p.category === 'fruit').slice(0, 8);
  const dryFruits = products.filter(p => p.category === 'dryfruit').slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 pb-20 lg:pb-6">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex flex-col gap-4 sm:gap-5">

        {/* ── Banner ── */}
        <BannerSlider banners={banners} loading={loadBanner} />

        {/* ── Shop by Category ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Shop by Category</h2>
            <Link to="/products" className="text-xs text-green-600 font-semibold hover:underline">View all →</Link>
          </div>

          {loadCat || loadProd ? (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="shrink-0 flex flex-col items-center gap-2 w-16 sm:w-20">
                  <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
                  <Skeleton className="h-3 w-12 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {/* 1. All — cart icon */}
              <CategoryCircle name="All" isAll onClick={() => navigate('/products')} />

              {/* 2. Fruits & Dry Fruits with real images */}
              {[
                { id: 'fruit',    name: 'Fruits',    img: '/fruits.jpeg',    type: 'fruit' },
                { id: 'dryfruit', name: 'Dry Fruits', img: '/dryfruits.jpeg', type: 'dryfruit' },
              ].map(c => (
                <CategoryCircle key={c.id} name={c.name} imageUrl={c.img}
                  onClick={() => navigate(`/products?type=${c.type}`)} />
              ))}

              {/* 3. API-driven categories from backend */}
              {categories.map(cat => (
                <CategoryCircle key={cat.id} name={cat.name} imageUrl={cat.imageUrl}
                  onClick={() => navigate(`/products?category=${cat.id}`)} />
              ))}

              {/* 4. Product-name circles — alphabetical, images from backend */}
              {(() => {
                const catNames = new Set(categories.map(c => c.name.toLowerCase()));
                const skipKeys = new Set(['fruit', 'fruits', 'dry', 'dryfruit', 'dryfruits']);
                const groupMap = new Map();

                for (const p of products) {
                  const key = p.name.split(' ')[0].toLowerCase();
                  if (catNames.has(key) || skipKeys.has(key)) continue;

                  const existing = groupMap.get(key);
                  // Always prefer a product that has an imageUrl
                  if (!existing) {
                    groupMap.set(key, { key, name: p.name.split(' ')[0], imageUrl: p.imageUrl || null });
                  } else if (!existing.imageUrl && p.imageUrl) {
                    existing.imageUrl = p.imageUrl;
                  }
                }

                return [...groupMap.values()]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .slice(0, 12)
                  .map(g => (
                    <CategoryCircle
                      key={`prod-${g.key}`}
                      name={g.name}
                      imageUrl={g.imageUrl}
                      onClick={() => navigate(`/products?q=${encodeURIComponent(g.name)}`)}
                    />
                  ));
              })()}
            </div>
          )}
        </section>

        {/* ── Today's Deals ── */}
        {(loadProd || featured.length > 0) && (
          <section>
            <div className="flex items-center mb-3">
              <span className="text-base mr-1.5">🔥</span>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Today's Deals</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {loadProd
                ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
                : featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* ── Fresh Fruits ── */}
        {(loadProd || fruits.length > 0) && (
          <section>
            <SectionHeader title="Fresh Fruits" linkTo="/products?type=fruit" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {loadProd
                ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
                : fruits.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* ── Dry Fruits ── */}
        {(loadProd || dryFruits.length > 0) && (
          <section>
            <SectionHeader title="Dry Fruits & Nuts" linkTo="/products?type=dryfruit" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {loadProd
                ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
                : dryFruits.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loadProd && products.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🍃</div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No products yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Check back soon — fresh stock coming!</p>
          </div>
        )}

        {/* ── Why KSR ── */}
        <section className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 sm:p-5 shadow-md">
          <h2 className="text-sm sm:text-base font-bold text-white mb-3 text-center">Why KSR Fruits?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '⚡', title: 'Fast Delivery', desc: 'Same day', bg: 'bg-white/15' },
              { icon: '🌿', title: 'Farm Fresh',    desc: 'Direct farms', bg: 'bg-white/15' },
              { icon: '💯', title: 'Quality',       desc: 'Hand-picked', bg: 'bg-white/15' },
              { icon: '💰', title: 'Best Prices',   desc: 'No hidden fees', bg: 'bg-white/15' },
            ].map(f => (
              <div key={f.title} className={`flex flex-col items-center text-center gap-1 ${f.bg} rounded-xl p-2.5`}>
                <span className="text-xl">{f.icon}</span>
                <p className="font-bold text-white text-xs sm:text-sm">{f.title}</p>
                <p className="text-[10px] sm:text-xs text-green-100">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
