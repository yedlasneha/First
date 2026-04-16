import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderApi, authApi } from '../api/axios';
import ProfitCalculator from './ProfitCalculator';
import AdminNav from '../components/AdminNav';
import s from './AdminDashboard.module.css';

const SC = {
  PLACED:           { bg:'#fff8e1', color:'#e65100', border:'#ffcc02', dot:'#f59e0b', label:'New' },
  ACCEPTED:         { bg:'#e3f2fd', color:'#1565c0', border:'#90caf9', dot:'#3b82f6', label:'Accepted' },
  OUT_FOR_DELIVERY: { bg:'#f3e5f5', color:'#6a1b9a', border:'#ce93d8', dot:'#a855f7', label:'On the way' },
  DELIVERED:        { bg:'#e8f5e9', color:'#2e7d32', border:'#c8e6c9', dot:'#22c55e', label:'Delivered' },
  CANCELLED:        { bg:'#ffebee', color:'#c62828', border:'#ffcdd2', dot:'#ef4444', label:'Cancelled' },
};
const PRIORITY = { PLACED:0, ACCEPTED:1, OUT_FOR_DELIVERY:2 };

const fmt = (d) => d ? new Date(d).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';

export default function AdminDashboard() {
  const { } = useAuth();
  const navigate = useNavigate();
  const [loading,  setLoading]  = useState(true);
  const [orders,   setOrders]   = useState([]);
  const [users,    setUsers]    = useState([]);
  const [error,    setError]    = useState('');
  const [showCalc, setShowCalc] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    load();
  }, []);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [oRes, uRes] = await Promise.allSettled([
        orderApi.get('/api/admin/orders'),
        authApi.get('/api/auth/admin/users'),
      ]);
      if (oRes.status === 'fulfilled') setOrders(oRes.value.data);
      if (uRes.status === 'fulfilled') setUsers(uRes.value.data);
    } catch { setError('Could not load data.'); }
    finally { setLoading(false); }
  };

  const active    = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const delivered = orders.filter(o => o.status === 'DELIVERED');
  const cancelled = orders.filter(o => o.status === 'CANCELLED');
  const revenue   = delivered.reduce((s,o) => s + parseFloat(o.totalAmount||0), 0);
  const todayRev  = delivered
    .filter(o => o.createdAt && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((s,o) => s + parseFloat(o.totalAmount||0), 0);
  const customers = users.filter(u => u.role === 'USER');
  const sortedActive = [...active].sort((a,b) => (PRIORITY[a.status]??9)-(PRIORITY[b.status]??9));

  if (loading) return (
    <div className={s.loadWrap}>
      <div className={s.spinner}/>
      <p>Loading dashboard…</p>
    </div>
  );

  return (
    <div className={s.page}>
      {showCalc && <ProfitCalculator onClose={() => setShowCalc(false)} />}

      {/* Shared Admin Navbar + Bottom Nav */}
      <AdminNav onCalc={() => setShowCalc(true)} />

      <div className={s.body}>
        {error && (
          <div className={s.errBox}>
            ⚠️ {error}
            <button onClick={load}>Retry</button>
          </div>
        )}

        {/* ── Stats ── */}
        <div className={s.statsGrid}>
          <div className={s.stat} style={{borderTop:'3px solid #f59e0b'}}>
            <div className={s.statEmoji}>🕐</div>
            <div className={s.statVal} style={{color:'#d97706'}}>{active.length}</div>
            <div className={s.statLbl}>Active</div>
          </div>
          <div className={s.stat} style={{borderTop:'3px solid #22c55e'}}>
            <div className={s.statEmoji}>💰</div>
            <div className={s.statVal} style={{color:'#16a34a'}}>₹{revenue.toFixed(0)}</div>
            <div className={s.statLbl}>Revenue</div>
          </div>
          <div className={s.stat} style={{borderTop:'3px solid #3b82f6'}}>
            <div className={s.statEmoji}>📦</div>
            <div className={s.statVal} style={{color:'#1d4ed8'}}>{orders.length}</div>
            <div className={s.statLbl}>Orders</div>
          </div>
          <div className={s.stat} style={{borderTop:'3px solid #a855f7'}}>
            <div className={s.statEmoji}>👥</div>
            <div className={s.statVal} style={{color:'#7c3aed'}}>{customers.length}</div>
            <div className={s.statLbl}>Customers</div>
          </div>
          <div className={s.stat} style={{borderTop:'3px solid #06b6d4'}}>
            <div className={s.statEmoji}>📅</div>
            <div className={s.statVal} style={{color:'#0891b2'}}>₹{todayRev.toFixed(0)}</div>
            <div className={s.statLbl}>Today</div>
          </div>
          <div className={s.stat} style={{borderTop:'3px solid #22c55e'}}>
            <div className={s.statEmoji}>✅</div>
            <div className={s.statVal} style={{color:'#16a34a'}}>{delivered.length}</div>
            <div className={s.statLbl}>Delivered</div>
          </div>
        </div>

        {/* ── Active Orders ── */}
        <div className={s.section}>
          <div className={s.secHead}>
            <div className={s.secTitleRow}>
              <span className={s.redDot}/>
              <div>
                <div className={s.secTitle}>Active Orders</div>
                <div className={s.secSub}>Needs action · sorted by urgency</div>
              </div>
              {active.length > 0 && (
                <span className={s.activeBadge}>{active.length}</span>
              )}
            </div>
            <button className={s.refreshBtn} onClick={load}>↻ Refresh</button>
          </div>

          {sortedActive.length === 0 ? (
            <div className={s.emptyBox}>
              <div className={s.emptyEmoji}>✅</div>
              <p>All caught up! No pending orders.</p>
            </div>
          ) : (
            <div className={s.orderCards}>
              {sortedActive.map((o, i) => {
                const sc = SC[o.status] || SC.PLACED;
                return (
                  <div key={o.id} className={`${s.orderCard} ${o.status==='PLACED'?s.orderCardNew:''}`}>
                    {/* Left accent */}
                    <div className={s.orderAccent} style={{background: sc.dot}}/>
                    <div className={s.orderBody}>
                      <div className={s.orderTop}>
                        <div className={s.orderMeta}>
                          <span className={s.orderNum}>#{i+1}</span>
                          <span className={s.orderId}>Order #{o.id}</span>
                        </div>
                        <span className={s.statusPill} style={{background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>
                          <span className={s.statusDot} style={{background:sc.dot}}/>
                          {sc.label}
                        </span>
                      </div>
                      <div className={s.orderDetails}>
                        <div className={s.detailItem}>
                          <span className={s.detailIcon}>👤</span>
                          <span>User #{o.userId}</span>
                        </div>
                        <div className={s.detailItem}>
                          <span className={s.detailIcon}>💳</span>
                          <span>{o.paymentId || 'COD'}</span>
                        </div>
                        <div className={s.detailItem}>
                          <span className={s.detailIcon}>🕐</span>
                          <span>{fmt(o.createdAt)}</span>
                        </div>
                        <div className={s.detailItem}>
                          <span className={s.detailIcon}>📍</span>
                          <span className={s.addrText}>{o.deliveryAddress || 'Home Delivery'}</span>
                        </div>
                      </div>
                      <div className={s.orderFooter}>
                        <span className={s.orderAmt}>₹{o.totalAmount}</span>
                        <button className={s.manageOrderBtn} onClick={() => navigate('/admin')}>
                          Manage →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button className={s.goManageBtn} onClick={() => navigate('/admin')}>
            Go to Orders Management →
          </button>
        </div>

        {/* ── Bottom grid ── */}
        <div className={s.bottomGrid}>
          {/* Recent Delivered */}
          <div className={s.card}>
            <div className={s.cardHead}>
              <span className={s.cardTitle}>Recent Delivered</span>
              <span className={s.chip} style={{background:'#dcfce7',color:'#16a34a'}}>{delivered.length}</span>
            </div>
            {delivered.length === 0
              ? <p className={s.empty}>No delivered orders yet.</p>
              : <div className={s.miniList}>
                  {[...delivered].reverse().slice(0,6).map(o => (
                    <div key={o.id} className={s.miniRow}>
                      <div className={s.miniDot} style={{background:'#22c55e'}}/>
                      <div className={s.miniInfo}>
                        <span className={s.miniTitle}>Order #{o.id}</span>
                        <span className={s.miniSub}>User #{o.userId} · {fmt(o.createdAt)}</span>
                      </div>
                      <span className={s.miniAmt}>₹{o.totalAmount}</span>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Recent Customers */}
          <div className={s.card}>
            <div className={s.cardHead}>
              <span className={s.cardTitle}>Recent Customers</span>
              <span className={s.chip} style={{background:'#ede9fe',color:'#7c3aed'}}>{customers.length}</span>
            </div>
            {customers.length === 0
              ? <p className={s.empty}>No customers yet.</p>
              : <div className={s.miniList}>
                  {[...customers].reverse().slice(0,6).map(u => (
                    <div key={u.userId} className={s.miniRow}>
                      <div className={s.avatar}>{(u.name||u.phone||'U').charAt(0).toUpperCase()}</div>
                      <div className={s.miniInfo}>
                        <span className={s.miniTitle}>{u.name || 'New User'}</span>
                        <span className={s.miniSub}>+91 {u.phone}</span>
                      </div>
                      <span className={u.profileComplete ? s.badgeOk : s.badgeWarn}>
                        {u.profileComplete ? '✓' : '⚠'}
                      </span>
                    </div>
                  ))}
                </div>
            }
          </div>

          {/* Order breakdown */}
          <div className={s.card}>
            <div className={s.cardHead}>
              <span className={s.cardTitle}>Order Breakdown</span>
            </div>
            <div className={s.breakdown}>
              {[
                { label:'Placed',        val: orders.filter(o=>o.status==='PLACED').length,           color:'#f59e0b', bg:'#fff8e1' },
                { label:'Accepted',      val: orders.filter(o=>o.status==='ACCEPTED').length,         color:'#3b82f6', bg:'#e3f2fd' },
                { label:'Out for Del.',  val: orders.filter(o=>o.status==='OUT_FOR_DELIVERY').length,  color:'#a855f7', bg:'#f3e5f5' },
                { label:'Delivered',     val: delivered.length,                                        color:'#22c55e', bg:'#e8f5e9' },
                { label:'Cancelled',     val: cancelled.length,                                        color:'#ef4444', bg:'#ffebee' },
              ].map(r => (
                <div key={r.label} className={s.bRow}>
                  <div className={s.bDot} style={{background:r.color}}/>
                  <span className={s.bLabel}>{r.label}</span>
                  <div className={s.bBar}>
                    <div className={s.bFill} style={{
                      width: orders.length ? `${(r.val/orders.length)*100}%` : '0%',
                      background: r.color,
                    }}/>
                  </div>
                  <span className={s.bVal} style={{color:r.color}}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
