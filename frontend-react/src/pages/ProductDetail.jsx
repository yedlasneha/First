import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Leaf, Zap, Heart, Shield, Star, ShoppingCart } from 'lucide-react';
import { productApi } from '../api/services';
import { useCart } from '../context/CartContext';
import { useUserAuth } from '../context/UserAuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { Skeleton } from '../components/Skeleton';

const BENEFIT_COLORS = [
  { bg: 'bg-green-50 dark:bg-green-900/20',   icon: 'text-green-600',  border: 'border-green-100 dark:border-green-800' },
  { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-500', border: 'border-orange-100 dark:border-orange-800' },
  { bg: 'bg-blue-50 dark:bg-blue-900/20',     icon: 'text-blue-500',   border: 'border-blue-100 dark:border-blue-800' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-500', border: 'border-purple-100 dark:border-purple-800' },
  { bg: 'bg-rose-50 dark:bg-rose-900/20',     icon: 'text-rose-500',   border: 'border-rose-100 dark:border-rose-800' },
  { bg: 'bg-teal-50 dark:bg-teal-900/20',     icon: 'text-teal-500',   border: 'border-teal-100 dark:border-teal-800' },
];
const BENEFIT_ICONS = [CheckCircle, Leaf, Zap, Heart, Shield, Star];

export default function ProductDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { addItem, updateQty, getQty } = useCart();
  const { isLoggedIn }                 = useUserAuth();
  const { toggle, isWishlisted }       = useWishlist();
  const { show }                       = useToast();

  const [product,    setProduct]    = useState(null);
  const [variants,   setVariants]   = useState([]);
  const [benefits,   setBenefits]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadBen,    setLoadBen]    = useState(true);
  const [adding,     setAdding]     = useState(false);
  const [selVariant, setSelVariant] = useState(null);

  useEffect(() => {
    setLoading(true); setLoadBen(true);
    Promise.all([
      productApi.getById(id),
      productApi.getVariants(id).catch(() => ({ data: [] })),
    ]).then(([pRes, vRes]) => {
      setProduct(pRes.data);
      setVariants(Array.isArray(vRes.data) ? vRes.data : []);
    }).catch(() => navigate('/products'))
      .finally(() => setLoading(false));

    productApi.getBenefits(id)
      .then(r => setBenefits(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBenefits([]))
      .finally(() => setLoadBen(false));
  }, [id]);

  const qty           = getQty(product?.id);
  const wished        = isWishlisted(product?.id);
  const activePrice   = selVariant
    ? (selVariant.discountPercentage > 0 ? selVariant.price * (1 - selVariant.discountPercentage / 100) : selVariant.price)
    : product ? (product.discountPercentage > 0 ? product.price * (1 - product.discountPercentage / 100) : product.price) : 0;
  const originalPrice = selVariant ? selVariant.price : product?.price;
  const outOfStock    = product ? product.quantity <= 0 : false;

  const handleAdd = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (outOfStock) return;
    setAdding(true);
    const ok = await addItem(product, 1);
    if (ok) show(`${product.name} added to cart`); else show('Failed to add item', 'error');
    setAdding(false);
  };

  const handleWish = () => {
    if (!product) return;
    toggle(product);
    show(wished ? 'Removed from wishlist' : `${product.name} added to wishlist`, wished ? 'info' : 'success');
  };

  /* ── Skeleton ── */
  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20 lg:pb-0">
      <div className="w-full px-3 sm:px-4 lg:px-0 py-3">
        <div className="lg:flex lg:h-[calc(100vh-7rem)]">
          <div className="lg:w-[42%] lg:sticky lg:top-0 p-4 lg:p-8">
            <Skeleton className="w-full aspect-square rounded-2xl" />
          </div>
          <div className="lg:flex-1 p-4 lg:p-8 flex flex-col gap-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-8 w-2/3 rounded-xl" />
            <Skeleton className="h-5 w-1/3 rounded" />
            <Skeleton className="h-10 w-1/2 rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-20 lg:pb-0">

      {/* Back button — always visible */}
      <div className="px-3 sm:px-4 lg:px-6 pt-3 pb-0">
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* ── Blinkit-style two-panel layout ── */}
      <div className="lg:flex lg:items-start">

        {/* LEFT — sticky image panel */}
        <div className="lg:w-[42%] lg:sticky lg:top-[7rem] lg:self-start p-3 sm:p-4 lg:p-8">
          <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden aspect-square border border-gray-100 dark:border-gray-700 shadow-sm">
            <img
              src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/600`}
              alt={product.name}
              className="w-full h-full object-contain p-4"
              onError={e => { e.target.src = `https://picsum.photos/seed/${product.id}/600/600`; }}
            />
            {product.discountPercentage > 0 && (
              <span className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-xl shadow">
                {product.discountPercentage}% OFF
              </span>
            )}
            <button onClick={handleWish}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all ${wished ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-400 hover:text-red-400'}`}>
              <Heart className={`w-4 h-4 ${wished ? 'fill-current' : ''}`} />
            </button>
            {outOfStock && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center rounded-2xl">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow">Out of Stock</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — scrollable info + benefits */}
        <div className="lg:flex-1 lg:overflow-y-auto px-3 sm:px-4 lg:px-8 pb-6 lg:pb-10 pt-0 lg:pt-8">

          {/* Category + Name */}
          <div className="mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold capitalize">{product.category}</span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white leading-tight mt-1">{product.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.unit}</p>
          </div>

          {/* Divider */}
          <hr className="border-gray-100 dark:border-gray-800 mb-4" />

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-3 flex-wrap">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">₹{activePrice.toFixed(0)}</span>
            {activePrice < originalPrice && (
              <>
                <span className="text-base text-gray-400 line-through">₹{originalPrice.toFixed(0)}</span>
                <span className="text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2.5 py-0.5 rounded-lg">
                  {product.discountPercentage}% off
                </span>
              </>
            )}
          </div>

          {/* Stock badge */}
          <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4 ${
            outOfStock ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${outOfStock ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
            {outOfStock ? 'Out of Stock' : `In Stock · ${product.quantity} ${product.unit} available`}
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Size</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelVariant(null)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${!selVariant ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400'}`}>
                  {product.unit} · ₹{product.price}
                </button>
                {variants.map(v => (
                  <button key={v.id} onClick={() => setSelVariant(v)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${selVariant?.id === v.id ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400'}`}>
                    {v.size} · ₹{v.price}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              {product.description}
            </p>
          )}

          {/* Add to cart — sticky on mobile, inline on desktop */}
          <div className="fixed bottom-16 left-0 right-0 px-3 pb-2 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 z-30">
            {qty > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-green-600 rounded-xl overflow-hidden shadow-md">
                  <button onClick={() => updateQty(product.id, qty - 1)}
                    className="px-4 py-3 text-white font-bold text-xl hover:bg-green-700 transition-colors">−</button>
                  <span className="px-4 font-bold text-white text-lg min-w-[2rem] text-center">{qty}</span>
                  <button onClick={() => updateQty(product.id, qty + 1)}
                    className="px-4 py-3 text-white font-bold text-xl hover:bg-green-700 transition-colors">+</button>
                </div>
                <button onClick={() => navigate('/cart')}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md">
                  <ShoppingCart className="w-4 h-4" /> Go to Cart →
                </button>
              </div>
            ) : (
              <button onClick={handleAdd} disabled={outOfStock || adding}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-md ${
                  outOfStock ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-green-600 hover:bg-green-700 text-white active:scale-95'
                }`}>
                {adding
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full spin" />
                  : outOfStock ? 'Out of Stock'
                  : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
              </button>
            )}
          </div>

          {/* ── Benefits — scrollable below product info ── */}
          <div className="mt-6 mb-24 lg:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-green-600 rounded-full" />
              <h2 className="text-base font-black text-gray-900 dark:text-white">Health Benefits</h2>
            </div>

            {loadBen ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-full rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : benefits.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 text-center">
                <p className="text-2xl mb-1">🌿</p>
                <p className="text-sm text-gray-400">No benefits added yet.</p>
              </div>
            ) : (
              /* All benefits listed — scroll naturally */
              <div className="flex flex-col gap-3">
                {benefits.map((b, i) => {
                  const c    = BENEFIT_COLORS[i % BENEFIT_COLORS.length];
                  const Icon = BENEFIT_ICONS[i % BENEFIT_ICONS.length];
                  return (
                    <div key={b.id}
                      className={`flex gap-3 p-4 rounded-2xl border ${c.bg} ${c.border}`}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white dark:bg-gray-800 shadow-sm">
                        <Icon className={`w-[18px] h-[18px] ${c.icon}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{b.title}</p>
                        {b.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{b.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
