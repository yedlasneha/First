import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUserAuth } from '../context/UserAuthContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addItem, updateQty, getQty } = useCart();
  const { isLoggedIn } = useUserAuth();
  const { show }       = useToast();
  const { toggle, isWishlisted } = useWishlist();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const qty = getQty(product.id);
  const discountedPrice = product.discountPercentage > 0
    ? product.price * (1 - product.discountPercentage / 100) : null;
  const displayPrice = discountedPrice ?? product.price;
  const outOfStock   = product.quantity <= 0;
  const wished       = isWishlisted(product.id);

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) { navigate('/login'); return; }
    if (outOfStock) return;
    setAdding(true);
    const ok = await addItem(product, 1);
    if (ok) show(`${product.name} added to cart`);
    else    show('Failed to add item', 'error');
    setAdding(false);
  };

  const handleWish = (e) => {
    e.stopPropagation();
    toggle(product);
    show(wished ? 'Removed from wishlist' : `${product.name} added to wishlist`, wished ? 'info' : 'success');
  };

  const handleInc = (e) => { e.stopPropagation(); updateQty(product.id, qty + 1); };
  const handleDec = (e) => { e.stopPropagation(); updateQty(product.id, qty - 1); };

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700 flex flex-col"
    >
      {/* Image — reduced height */}
      <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-700" style={{ aspectRatio: '1/0.85' }}>
        <img
          src={product.imageUrl || `https://picsum.photos/seed/${product.id}/300/300`}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={e => { e.target.src = `https://picsum.photos/seed/${product.id}/300/300`; }}
        />
        {/* Discount badge */}
        {product.discountPercentage > 0 && (
          <span className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[9px] font-bold px-1 py-0.5 rounded">
            {product.discountPercentage}% OFF
          </span>
        )}
        <button onClick={handleWish}
          className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-all ${wished ? 'bg-red-500 text-white' : 'bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-red-400'}`}>
          <svg className="w-3 h-3" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2 flex flex-col flex-1">
        <p className="text-[9px] text-gray-400 mb-0.5 capitalize font-medium">{product.category || 'fruit'}</p>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-xs leading-tight line-clamp-2 mb-0.5">{product.name}</h3>
        <p className="text-[10px] text-gray-400 mb-1.5">{product.unit}</p>

        <div className="flex items-center gap-1 mb-2 mt-auto">
          <span className="font-bold text-gray-900 dark:text-white text-xs">₹{displayPrice.toFixed(0)}</span>
          {discountedPrice && (
            <span className="text-[10px] text-gray-400 line-through">₹{product.price.toFixed(0)}</span>
          )}
        </div>

        {qty > 0 ? (
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/30 rounded-lg overflow-hidden border border-green-200 dark:border-green-700">
            <button onClick={handleDec} className="px-2.5 py-1 text-green-700 dark:text-green-400 font-bold text-base hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">−</button>
            <span className="font-bold text-green-700 dark:text-green-400 text-xs">{qty}</span>
            <button onClick={handleInc} className="px-2.5 py-1 text-green-700 dark:text-green-400 font-bold text-base hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">+</button>
          </div>
        ) : (
          <button onClick={handleAdd} disabled={outOfStock || adding}
            className={`w-full py-1 rounded-lg text-xs font-semibold transition-all ${
              outOfStock ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' :
              'bg-green-600 hover:bg-green-700 text-white active:scale-95'
            }`}>
            {adding ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full spin" /> : 'Add'}
          </button>
        )}
      </div>
    </div>
  );
}
