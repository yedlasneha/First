import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { orderApi } from '../api/axios';
import logo from '../assets/icon.png';

const STATUS_CONFIG = {
  PLACED:           { label: 'Order Placed',      color: '#f57f17', bg: '#fff8e1', icon: '🕐' },
  ACCEPTED:         { label: 'Accepted',           color: '#1565c0', bg: '#e3f2fd', icon: '✅' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',   color: '#6a1b9a', bg: '#f3e5f5', icon: '🚚' },
  DELIVERED:        { label: 'Delivered',          color: '#2e7d32', bg: '#e8f5e9', icon: '📦' },
  CANCELLED:        { label: 'Cancelled',          color: '#c62828', bg: '#ffebee', icon: '❌' },
};

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function Orders() {
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    orderApi.get(`/api/orders/my?userId=${user.userId}`)
      .then(r => setOrders(r.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  const sc = (s) => STATUS_CONFIG[s] || { label: s, color: '#555', bg: '#f5f5f5', icon: '📋' };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Navbar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontWeight: 600, fontSize: '0.85rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={logo} alt="KSR" style={{ width: 30, height: 30, borderRadius: 8 }} />
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>
              <span style={{ color: '#16a34a' }}>My</span>
              <span style={{ color: '#f97316' }}> Orders</span>
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #f3f4f6' }}>
                <div style={{ height: 14, background: '#f3f4f6', borderRadius: 6, width: '40%', marginBottom: 10 }} />
                <div style={{ height: 10, background: '#f3f4f6', borderRadius: 6, width: '70%' }} />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📦</div>
            <p style={{ fontWeight: 700, color: '#374151', fontSize: '1.1rem', marginBottom: 8 }}>No orders yet</p>
            <p style={{ color: '#9ca3af', marginBottom: 24 }}>Start shopping to see your orders here</p>
            <button onClick={() => navigate('/home')}
              style={{ padding: '12px 28px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
              Shop Now
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...orders].reverse().map((order, idx) => {
              const cfg = sc(order.status);
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  {/* Header */}
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    onClick={() => setExpanded(isOpen ? null : order.id)}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>Order #{orders.length - idx}</span>
                        <span style={{ padding: '2px 10px', borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: '0.72rem', fontWeight: 700 }}>{cfg.label}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>{fmt(order.createdAt)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>₹{order.totalAmount}</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #f3f4f6', padding: '14px 16px' }}>
                      {/* Progress bar */}
                      {order.status !== 'CANCELLED' && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            {['PLACED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((s, i) => {
                              const steps = ['PLACED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                              const currentStep = steps.indexOf(order.status);
                              const done = i <= currentStep;
                              const c = sc(s);
                              return (
                                <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: done ? c.bg : '#f3f4f6', border: `2px solid ${done ? c.color : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                    {done ? c.icon : '○'}
                                  </div>
                                  <span style={{ fontSize: '0.6rem', color: done ? c.color : '#9ca3af', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{c.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {(order.items || []).map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: 10 }}>
                            <div>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111827' }}>{item.productName || `Product #${item.productId}`}</span>
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: 8 }}>× {item.quantity}</span>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280' }}>
                          <span>Delivery</span><span style={{ color: '#16a34a', fontWeight: 600 }}>FREE</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, color: '#111827' }}>
                          <span>Total</span><span>₹{order.totalAmount}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                          <span>📍 {order.deliveryAddress || 'Home Delivery'}</span>
                          <span>💳 {order.paymentId === 'COD' ? 'Cash on Delivery' : 'Online'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
