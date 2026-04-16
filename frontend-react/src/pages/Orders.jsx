import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import { orderApi } from '../api/services';
import { OrderCardSkeleton } from '../components/Skeleton';

const STATUS_CONFIG = {
  PLACED:           { label: 'Order Placed',    color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-300',  dot: 'bg-orange-500',  icon: '🕐' },
  ACCEPTED:         { label: 'Accepted',         color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-300',    dot: 'bg-blue-500',    icon: '✅' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'text-violet-700',  bg: 'bg-violet-100',  border: 'border-violet-300',  dot: 'bg-violet-500',  icon: '🚚' },
  DELIVERED:        { label: 'Delivered',        color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-300', dot: 'bg-emerald-500', icon: '📦' },
  CANCELLED:        { label: 'Cancelled',        color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-300',     dot: 'bg-red-500',     icon: '✕'  },
};

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function Orders() {
  const { user, isLoggedIn } = useUserAuth();
  const navigate = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!user?.userId) return;
    orderApi.getMyOrders(user.userId)
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError('Could not load orders. Please try again.'))
      .finally(() => setLoading(false));
  }, [user?.userId, isLoggedIn]);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 lg:pb-6">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 px-3 sm:px-4 h-14">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <h1 className="text-base font-black text-gray-900 dark:text-white flex-1">My Orders</h1>
          {!loading && (
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{orders.length} orders</span>
          )}
        </div>

        {/* Filter chips — sticky below title, wrap on 2 rows for mobile */}
        <div className="px-3 sm:px-4 pb-2.5">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all',              label: 'All' },
              { key: 'PLACED',           label: 'Placed' },
              { key: 'ACCEPTED',         label: 'Accepted' },
              { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
              { key: 'DELIVERED',        label: 'Delivered' },
              { key: 'CANCELLED',        label: 'Cancelled' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                  filter === f.key
                    ? 'bg-green-600 text-white border-green-600 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-green-400 hover:text-green-600'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => <OrderCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-sm mb-3">{error}</p>
            <button onClick={() => window.location.reload()}
              className="text-green-600 font-semibold text-sm hover:underline">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
              {filter === 'all' ? 'No orders yet' : `No ${STATUS_CONFIG[filter]?.label} orders`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Start shopping to see your orders here</p>
            <button onClick={() => navigate('/products')}
              className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all">
              Shop Now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {[...filtered].reverse().map((order) => {
              const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.PLACED;
              const isCOD = (order.paymentId || '').toUpperCase() === 'COD';
              return (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  {/* Colored top accent bar */}
                  <div className={`h-1 w-full ${sc.dot}`} />

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="font-black text-gray-900 dark:text-white text-sm">Order #{order.id}</span>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{fmt(order.createdAt)}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sc.color} ${sc.bg} ${sc.border}`}>
                      <span>{sc.icon}</span>
                      {sc.label}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="px-4 pb-3 border-t border-gray-50 dark:border-gray-700/50 pt-2">
                    {(order.items || []).slice(0, 3).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-600 dark:text-gray-400 truncate flex-1 mr-2">
                          <span className="text-green-600 font-semibold">{item.productName}</span>
                          <span className="text-gray-400"> × {item.quantity}</span>
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 shrink-0">₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                    {(order.items || []).length > 3 && (
                      <p className="text-xs text-gray-400 mt-1">+{order.items.length - 3} more items</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700/30 dark:to-gray-700/20 border-t border-green-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-green-700 dark:text-green-400 text-base">₹{order.totalAmount}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isCOD ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isCOD ? '💵 COD' : '📱 Online'}
                      </span>
                    </div>
                    {order.deliveryAddress && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[160px] text-right truncate">
                        📍 {order.deliveryAddress.split('|').pop()?.trim() || order.deliveryAddress}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
