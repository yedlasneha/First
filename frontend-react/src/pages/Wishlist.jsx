import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const { items } = useWishlist();
  const navigate  = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 lg:pb-6">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 px-3 sm:px-4 h-14">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <h1 className="text-base font-black text-gray-900 dark:text-white">My Wishlist</h1>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{items.length} items</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-red-300 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Tap ❤️ on any product to save it here
            </p>
            <button onClick={() => navigate('/products')}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all active:scale-95">
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {items.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
