import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Package, ShoppingBag, CheckCircle } from 'lucide-react';

export default function OrderSuccess() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const order     = state?.order;

  useEffect(() => { if (!order) navigate('/home'); }, [order]);
  if (!order) return null;

  const isCOD = (order.paymentId || '').toUpperCase() === 'COD' || order.paymentMethod === 'COD';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col pb-20 lg:pb-0">

      {/* ── Top green success strip ── */}
      <div className="bg-green-600 px-4 pt-10 pb-8 text-center flex flex-col items-center">
        {/* Animated check circle */}
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg animate-bounce-in">
          <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-black text-white mb-1">Order Placed Successfully!</h1>
        <p className="text-green-100 text-sm font-medium">
          Shop more for a healthy life 🍎
        </p>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg mx-auto w-full">

        {/* Order info card */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-green-600" />
            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">Order Details</span>
          </div>
          <div className="grid grid-cols-2 gap-y-2.5 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Order ID</span>
            <span className="font-bold text-gray-800 dark:text-gray-100 text-right">#{order.id}</span>

            <span className="text-gray-500 dark:text-gray-400">Total Amount</span>
            <span className="font-bold text-green-600 text-right">₹{order.totalAmount}</span>

            <span className="text-gray-500 dark:text-gray-400">Payment</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300 text-right">
              {isCOD ? '💵 Cash on Delivery' : '📱 Online (UPI)'}
            </span>

            <span className="text-gray-500 dark:text-gray-400">Status</span>
            <span className="text-right">
              <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {order.status || 'PLACED'}
              </span>
            </span>
          </div>
        </div>

        {/* Items */}
        {order.items?.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Items Ordered</p>
            <div className="flex flex-col gap-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 dark:text-gray-300 flex-1 mr-2 truncate">
                    {item.productName}
                    <span className="text-gray-400 dark:text-gray-500"> × {item.quantity}</span>
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 shrink-0">
                    ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-100 dark:border-green-800 text-center">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            {isCOD
              ? '🚚 Your order has placed ! Pay Now through Online or when it arrives at your door.'
              : '✅ Payment confirmed! We\'ll deliver your order soon.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 mt-auto pt-2">
          <Link to="/orders"
            className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-all text-center text-sm shadow-md active:scale-95 flex items-center justify-center gap-2">
            <Package className="w-4 h-4" /> Track My Order
          </Link>
          <Link to="/home"
            className="w-full py-3 border-2 border-green-600 text-green-600 dark:text-green-400 font-bold rounded-2xl transition-all text-center text-sm hover:bg-green-50 dark:hover:bg-green-900/20 active:scale-95 flex items-center justify-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
