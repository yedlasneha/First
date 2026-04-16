import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUserAuth } from '../context/UserAuthContext';

export default function Cart() {
  const { items, loading, total, updateQty, removeItem, clearCart } = useCart();
  const { isLoggedIn } = useUserAuth();
  const navigate = useNavigate();

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Login to add items to your cart</p>
        <button onClick={() => navigate('/login')} className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all">Login</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full spin" />
    </div>
  );

  if (items.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 text-sm mb-6">Add some fresh fruits to get started!</p>
        <button onClick={() => navigate('/products')} className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all">Shop Now</button>
      </div>
    </div>
  );

  const deliveryFee = total >= 299 ? 0 : 30;
  const grandTotal  = total + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-6">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg sm:text-xl font-black text-gray-900">My Cart ({items.length})</h1>
          <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors">Clear all</button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Items */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-3 sm:p-4 flex items-center gap-3 shadow-sm border border-gray-100">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                  <img src={`https://picsum.photos/seed/${item.productId}/80/80`} alt={item.productName}
                    className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{item.productName}</h3>
                  <p className="text-green-600 font-bold text-sm mt-0.5">₹{parseFloat(item.price).toFixed(0)} each</p>
                  <p className="text-xs text-gray-400 mt-0.5">Subtotal: ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <div className="flex items-center bg-green-50 border border-green-200 rounded-xl overflow-hidden">
                    <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="px-2.5 py-1.5 text-green-700 font-bold hover:bg-green-100 transition-colors text-sm">−</button>
                    <span className="px-2.5 font-bold text-green-700 text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="px-2.5 py-1.5 text-green-700 font-bold hover:bg-green-100 transition-colors text-sm">+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 sticky top-20">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-gray-400">Add ₹{(299 - total).toFixed(0)} more for free delivery</p>
                )}
                <hr className="border-gray-100" />
                <div className="flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>₹{grandTotal.toFixed(0)}</span>
                </div>
              </div>
              <button onClick={() => navigate('/checkout')}
                className="w-full mt-4 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all active:scale-95">
                Proceed to Checkout →
              </button>
              <button onClick={() => navigate('/products')}
                className="w-full mt-2 py-2.5 text-green-600 font-semibold text-sm hover:underline">
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
