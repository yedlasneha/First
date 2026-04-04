import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { productApi, orderApi, USER_TOKEN_KEY } from '../api/axios';
import logo from '../assets/icon.png';

const BULK_API = 'http://localhost:8084/api/bulk-orders';

const getImg = (url, seed) => {
  if (!url) return `https://picsum.photos/seed/${seed}/400/400`;
  if (url.startsWith('data:')) return url; // base64
  if (url.startsWith('http')) return url;
  return `https://picsum.photos/seed/${seed}/400/400`;
};

// ── Speech recognition hook ──────────────────────────────────────────────
function useSpeech(onResult) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert('Voice search not supported in this browser');
    const rec = new SR();
    rec.lang = 'en-IN'; rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onresult = e => onResult(e.results[0][0].transcript);
    rec.onerror  = () => setListening(false);
    recRef.current = rec;
    rec.start();
  };
  const stop = () => { recRef.current?.abort(); setListening(false); };
  return { listening, start, stop };
}

export default function Home() {
  const { user, logout } = useUserAuth();
  const { cart, addToCart, updateQty, removeFromCart, clearCart, total, count, loadCart, enrichCart } = useCart();
  const { dark } = useTheme();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const navigate = useNavigate();

  const [products,     setProducts]     = useState([]);
  const [banners,      setBanners]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [bannerIdx,    setBannerIdx]    = useState(0);
  const [showCart,     setShowCart]     = useState(false);
  const [showBulk,     setShowBulk]     = useState(false);
  const [showLogin,    setShowLogin]    = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [location,     setLocation]     = useState('Set delivery location');
  const [toast,        setToast]        = useState('');
  const [addedId,      setAddedId]      = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ address: '', paymentMethod: 'COD' });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [showBuyAgain, setShowBuyAgain] = useState(false);
  const [pastOrders, setPastOrders] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  const [showConfirm, setShowConfirm] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');       // UTR / transaction ID for online payment
  const [paymentDone, setPaymentDone] = useState(false); // user confirmed they paid
  const [savedAddresses, setSavedAddresses] = useState([]); // addresses from profile
  const [locLoading, setLocLoading] = useState(false);  // fetching live location

  // Bulk form
  const [bulkForm, setBulkForm] = useState({ fruit:'', qty:'', unit:'kg', date:'', notes:'', agreed:false });
  const [bulkErr,  setBulkErr]  = useState('');
  const [bulkOk,   setBulkOk]   = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  const { listening, start: startVoice } = useSpeech(t => setSearch(t));

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // Load cart from backend when user is present
  useEffect(() => { if (user) loadCart(); }, [user]);

  // Auto-advance banner
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners.length]);

  // Fetch products + banners
  useEffect(() => {
    Promise.all([
      productApi.get('/api/products').then(r => { setProducts(r.data); return r.data; }).catch(() => []),
      productApi.get('/api/banners').then(r => setBanners(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      productApi.get('/api/payment-settings').then(r => setPaymentSettings(r.data)).catch(() => {}),
    ]).then(([prods]) => {
      if (prods && prods.length > 0) enrichCart(prods);
    }).finally(() => setLoading(false));
  }, []);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
        .then(r => r.json())
        .then(d => {
          const addr = d.address;
          setLocation([addr.suburb || addr.neighbourhood || addr.village, addr.city || addr.town || addr.county].filter(Boolean).join(', ') || d.display_name?.split(',').slice(0,2).join(','));
        }).catch(() => {});
    }, () => {});
  }, []);

  // Unique categories from products
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeFilter === 'All' || p.category === activeFilter;
    return matchSearch && matchCat;
  }).sort((a, b) => {
    if (sortBy === 'low')  return parseFloat(a.price) - parseFloat(b.price);
    if (sortBy === 'high') return parseFloat(b.price) - parseFloat(a.price);
    return 0;
  });

  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  const handleAdd = (p) => {
    if (!user) { setShowLogin(true); return; }
    addToCart(p);
    setAddedId(p.id);
    showToast(`${p.name} added to cart`);
    setTimeout(() => setAddedId(null), 600);
  };

  const submitBulk = async (e) => {
    e.preventDefault(); setBulkErr('');
    if (!bulkForm.fruit) return setBulkErr('Select a fruit');
    if (!bulkForm.qty || +bulkForm.qty <= 0) return setBulkErr('Enter valid quantity');
    if (!bulkForm.date) return setBulkErr('Select delivery date');
    if (!bulkForm.agreed) return setBulkErr('Accept the terms to proceed');
    setBulkSaving(true);
    try {
      const token = localStorage.getItem(USER_TOKEN_KEY);
      await fetch(BULK_API, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId: user?.userId, fruitName: bulkForm.fruit, quantity: +bulkForm.qty, unit: bulkForm.unit, deliveryDate: bulkForm.date, notes: bulkForm.notes }),
      });
      setBulkOk(true);
    } catch { setBulkOk(true); }
    finally { setBulkSaving(false); }
  };

  const closeBulk = () => { setShowBulk(false); setBulkOk(false); setBulkForm({ fruit:'', qty:'', unit:'kg', date:'', notes:'', agreed:false }); setBulkErr(''); };

  const initials = (user?.name || user?.email || 'U').trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  // ── Invoice generator ─────────────────────────────────────────────────
  const generateInvoice = (order, cartItems, orderTotal, form) => {
    const rows = cartItems.map((item, i) => `<tr><td>${i+1}</td><td>${item.name}</td><td>${item.qty}</td><td>₹${item.price}</td><td>₹${(item.price*item.qty).toFixed(0)}</td></tr>`).join('');
    const html = `<html><head><title>KSR Invoice</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:32px;max-width:640px;margin:0 auto}.hdr{border-bottom:3px solid #16a34a;padding-bottom:12px;margin-bottom:16px}.hdr h1{color:#16a34a;font-size:22px}table{width:100%;border-collapse:collapse;margin:12px 0}th{background:#16a34a;color:#fff;padding:9px 12px;text-align:left;font-size:13px}td{padding:8px 12px;font-size:13px;border-bottom:1px solid #f0f0f0}.total{margin-top:12px;border-top:2px dashed #e0e0e0;padding-top:12px;display:flex;justify-content:space-between;font-size:16px;font-weight:800}.footer{margin-top:20px;text-align:center;font-size:11px;color:#aaa}</style></head><body><div class="hdr"><h1>🍎 KSR Fruits — Invoice</h1><p>Order #${order?.id||'—'} · ${new Date().toLocaleString('en-IN')}</p></div><p style="margin-bottom:12px;font-size:13px">Customer: <strong>${user?.name||user?.email||'—'}</strong> · Address: ${form.address} · Payment: ${form.paymentMethod==='COD'?'Cash on Delivery':'Online'}</p><table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div class="total"><span>Total</span><span>₹${orderTotal.toFixed(0)}</span></div><div class="footer">KSR Fruits · Thank you!</div></body></html>`;
    const blob = new Blob([html],{type:'text/html'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href=url; a.download=`KSR-Invoice-${order?.id||Date.now()}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Dark mode colour tokens ────────────────────────────────────────────
  const dk = {
    bg:        dark ? '#0d1117' : '#f8f9fa',
    card:      dark ? '#161b22' : '#ffffff',
    card2:     dark ? '#21262d' : '#f9fafb',
    border:    dark ? '#30363d' : '#e5e7eb',
    border2:   dark ? '#21262d' : '#f3f4f6',
    text:      dark ? '#e6edf3' : '#111827',
    textSub:   dark ? '#8b949e' : '#6b7280',
    textMuted: dark ? '#6e7681' : '#9ca3af',
    navBg:     dark ? '#161b22' : '#ffffff',
    inputBg:   dark ? '#0d1117' : '#f9fafb',
    inputBdr:  dark ? '#30363d' : '#e5e7eb',
    stripBg:   dark ? '#0d1117' : '#f3f4f6',
    pillBg:    dark ? '#21262d' : '#ffffff',
    pillBdr:   dark ? '#30363d' : '#e5e7eb',
    skeletonA: dark ? '#21262d' : '#f3f4f6',
    skeletonB: dark ? '#30363d' : '#e9eaec',
    shadow:    dark ? '0 1px 8px rgba(0,0,0,0.5)' : '0 1px 8px rgba(0,0,0,0.06)',
    menuBg:    dark ? '#161b22' : '#ffffff',
    menuBdr:   dark ? '#30363d' : '#e5e7eb',
    cartBg:    dark ? '#161b22' : '#ffffff',
    cartItem:  dark ? '#21262d' : '#f9fafb',
    modalBg:   dark ? '#161b22' : '#ffffff',
  };

  return (
    <div style={{ minHeight:'100vh', background:dk.bg, fontFamily:"'Inter','Segoe UI',sans-serif" }}>

      {/* ── FIXED TOP WRAPPER ─────────────────────────────────────────── */}
      <div style={{ position:'sticky', top:0, zIndex:100 }}>

        {/* Info strip */}
        <div style={{ background:'#16a34a', color:'#fff', textAlign:'center', padding:'7px 16px', fontSize:'0.78rem', fontWeight:500 }}>
          Free delivery on orders above ₹299 &nbsp;·&nbsp; Fresh fruits daily &nbsp;·&nbsp; 100% quality guaranteed
        </div>

        {/* Navbar */}
        <header style={{ background:dk.navBg, borderBottom:`1px solid ${dk.border}`, boxShadow:dk.shadow }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 16px', height:60, display:'flex', alignItems:'center', gap:12 }}>

            {/* Logo — compact on mobile */}
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, cursor:'pointer' }} onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
              <img src={logo} alt="KSR Fruits" style={{ width:32, height:32, borderRadius:8, objectFit:'contain' }} />
              <div className="hide-mobile">
                <div style={{ fontWeight:800, fontSize:'0.9rem', lineHeight:1.1 }}>
                  <span style={{ color:'#16a34a' }}>KSR</span>
                  <span style={{ color:'#f97316' }}> Fruits</span>
                </div>
                <div style={{ fontSize:'0.55rem', color:dk.textMuted, lineHeight:1 }}>Freshness You Can Trust</div>
              </div>
            </div>

            {/* Desktop nav */}
            <nav style={{ display:'flex', gap:4, marginLeft:8 }} className="hide-mobile">
              <button style={{ padding:'6px 14px', borderRadius:8, border:'none', background:dark?'#1a3a2a':'#f0fdf4', color:'#16a34a', fontWeight:700, cursor:'pointer', fontSize:'0.85rem' }}>Home</button>
              <button style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'transparent', color:dk.textSub, fontWeight:600, cursor:'pointer', fontSize:'0.85rem' }}>Shop</button>
            </nav>

            {/* Search bar — takes max space */}
            <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center' }}>
              <span style={{ position:'absolute', left:12, color:'#9ca3af', display:'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fruits, products..."
                style={{ width:'100%', padding:'9px 40px 9px 36px', border:`1.5px solid ${dk.inputBdr}`, borderRadius:24, fontSize:'0.85rem', outline:'none', background:dk.inputBg, color:dk.text, boxSizing:'border-box' }} />
              <button onClick={listening ? undefined : startVoice} title="Voice search"
                style={{ position:'absolute', right:10, background:'none', border:'none', cursor:'pointer', color: listening ? '#dc2626' : '#9ca3af', display:'flex', padding:4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={listening ? '#dc2626' : 'currentColor'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/>
                </svg>
              </button>
            </div>

            {/* Right actions */}
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              {/* Orders — desktop only */}
              <button onClick={() => user ? navigate('/orders') : navigate('/login')}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:10, border:'none', background:'transparent', color:dk.textSub, fontWeight:600, cursor:'pointer', fontSize:'0.82rem' }}
                className="hide-mobile">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                Orders
              </button>

              {/* Wishlist — replaces Cart icon in top bar */}
              <button onClick={() => user ? navigate('/profile') : navigate('/login')}
                style={{ position:'relative', display:'flex', alignItems:'center', gap:5, padding:'6px 10px', borderRadius:10, border:'none', background:'transparent', color:dk.textSub, fontWeight:600, cursor:'pointer', fontSize:'0.82rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span className="hide-mobile">Wishlist</span>
              </button>

              {/* User avatar / Login */}
              {user ? (
                <div style={{ position:'relative' }}>
                  <button onClick={() => setUserMenuOpen(v => !v)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px 4px 4px', borderRadius:24, border:`1.5px solid ${dk.border}`, background:'transparent', cursor:'pointer' }}>
                    {/* Avatar with initial */}
                    <div style={{
                      width:30, height:30, borderRadius:'50%',
                      background:'linear-gradient(135deg,#16a34a,#059669)',
                      color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.75rem', fontWeight:800, letterSpacing:0, flexShrink:0,
                      boxShadow:'0 2px 6px rgba(22,163,74,0.35)'
                    }}>
                      {initials}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="hide-mobile">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:dk.menuBg, borderRadius:14, boxShadow:dark?'0 12px 40px rgba(0,0,0,0.6)':'0 12px 40px rgba(0,0,0,0.14)', border:`1px solid ${dk.menuBdr}`, minWidth:200, zIndex:300, overflow:'hidden' }}>
                      {/* User info header */}
                      <div style={{ padding:'14px 16px', borderBottom:`1px solid ${dk.border2}`, display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#16a34a,#059669)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', fontWeight:800, flexShrink:0 }}>
                          {initials}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ margin:0, fontWeight:700, fontSize:'0.85rem', color:dk.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name || 'User'}</p>
                          <p style={{ margin:0, fontSize:'0.7rem', color:dk.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</p>
                        </div>
                      </div>
                      {/* Menu items */}
                      {[
                        { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>, label:'My Orders', action: () => { navigate('/orders'); setUserMenuOpen(false); } },
                        { icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label:'Profile & Settings', action: () => { navigate('/profile'); setUserMenuOpen(false); } },
                      ].map((item, i) => (
                        <button key={i} onClick={item.action}
                          style={{ width:'100%', padding:'11px 16px', background:'none', border:'none', textAlign:'left', color:dk.text, fontWeight:600, cursor:'pointer', fontSize:'0.83rem', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${dk.border2}` }}>
                          <span style={{ color:dk.textSub }}>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                      <button onClick={() => { logout(); setUserMenuOpen(false); navigate('/login'); }}
                        style={{ width:'100%', padding:'11px 16px', background:'none', border:'none', textAlign:'left', color:'#ef4444', fontWeight:600, cursor:'pointer', fontSize:'0.83rem', display:'flex', alignItems:'center', gap:10 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => navigate('/login')}
                  style={{ padding:'7px 16px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.82rem' }}>
                  Login
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Location bar */}
        <div style={{ background:dk.navBg, borderBottom:`1px solid ${dk.border2}`, padding:'6px 16px', display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span style={{ fontSize:'0.78rem', color:dk.text, fontWeight:500, flex:1 }}>{location}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={dk.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:120, left:'50%', transform:'translateX(-50%)', background:'#16a34a', color:'#fff', padding:'8px 20px', borderRadius:24, fontSize:'0.82rem', fontWeight:600, zIndex:999, whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
      {banners.length > 0 && (
        <div style={{ position:'relative', margin:'0', overflow:'hidden', height:'clamp(180px,32vw,340px)', background:'#1a1a2e' }}>
          {banners.map((b, i) => (
            <div key={b.id} style={{ position:'absolute', inset:0, transition:'opacity 0.6s', opacity: i === bannerIdx ? 1 : 0 }}>
              <img src={b.imageUrl} alt={b.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                onError={e => { e.target.src = `https://picsum.photos/seed/banner${i}/1200/400`; }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
              <div style={{ position:'absolute', bottom:0, left:0, padding:'20px 28px', color:'#fff' }}>
                {b.tag && <span style={{ background:'rgba(255,255,255,0.2)', backdropFilter:'blur(4px)', padding:'3px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, marginBottom:8, display:'inline-block', border:'1px solid rgba(255,255,255,0.3)' }}>{b.tag}</span>}
                <h2 style={{ margin:'6px 0 4px', fontSize:'clamp(1.1rem,3vw,1.8rem)', fontWeight:800, lineHeight:1.2, textShadow:'0 2px 8px rgba(0,0,0,0.4)' }}>{b.title}</h2>
                {b.subtitle && <p style={{ margin:0, fontSize:'0.82rem', opacity:0.85 }}>{b.subtitle}</p>}
              </div>
            </div>
          ))}
          {/* Dots */}
          {banners.length > 1 && (
            <div style={{ position:'absolute', bottom:10, right:16, display:'flex', gap:6 }}>
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIdx(i)}
                  style={{ width: i === bannerIdx ? 20 : 6, height:6, borderRadius:3, background: i === bannerIdx ? '#fff' : 'rgba(255,255,255,0.5)', border:'none', cursor:'pointer', padding:0, transition:'all 0.3s' }} />
              ))}
            </div>
          )}
          {/* Arrows */}
          {banners.length > 1 && (<>
            <button onClick={() => setBannerIdx(i => (i - 1 + banners.length) % banners.length)}
              style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', width:32, height:32, borderRadius:'50%', background:'rgba(0,0,0,0.4)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
            <button onClick={() => setBannerIdx(i => (i + 1) % banners.length)}
              style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:32, height:32, borderRadius:'50%', background:'rgba(0,0,0,0.4)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
          </>)}
        </div>
      )}

      {/* ── PRE-BOOK BULK ORDER BAR ───────────────────────────────────────── */}
      <div style={{ background:'#1c1c2e', margin:'0', padding:'10px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, background:'#f97316', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, color:'#fff', fontWeight:700, fontSize:'0.85rem' }}>Pre-Book Bulk Order</p>
          <p style={{ margin:0, color:'rgba(255,255,255,0.6)', fontSize:'0.72rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Min 10kg • Banana 24 Dozen • Dry Fruits 3kg</p>
        </div>
        <button onClick={() => setShowBulk(true)}
          style={{ flexShrink:0, padding:'8px 18px', background:'#f97316', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:'0.82rem' }}>
          Book Now
        </button>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth:1200, margin:'0 auto', padding:'16px 12px 80px' }}>

        {/* Categories */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <h2 style={{ margin:0, fontSize:'0.95rem', fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:dk.text }}>Categories</h2>
          </div>
          <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:4 }}>
            {['All', ...new Set(products.map(p => p.name).filter(Boolean))].slice(0, 12).map(name => {
              const prod = products.find(p => p.name === name);
              const isActive = activeFilter === name;
              return (
                <button key={name} onClick={() => setActiveFilter(name)}
                  style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer' }}>
                  <div style={{ width:64, height:64, borderRadius:'50%', overflow:'hidden', border: isActive ? '2.5px solid #16a34a' : `2px solid ${dk.border}`, background:dark?'#21262d':'#fef2f2', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', transform: isActive ? 'scale(1.08)' : 'scale(1)' }}>
                    {name === 'All'
                      ? <span style={{ fontSize:'1.4rem' }}>🛒</span>
                      : <img src={getImg(prod?.imageUrl, prod?.id)} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.src = `https://picsum.photos/seed/${name}/64`; }} />
                    }
                  </div>
                  <span style={{ fontSize:'0.72rem', fontWeight:600, color: isActive ? '#16a34a' : dk.textSub, maxWidth:64, textAlign:'center', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter pills + Sort — inline row */}
        <div style={{ display:'flex', alignItems:'center', gap:8, overflowX:'auto', marginBottom:16, paddingBottom:2 }}>
          {[
            { label: 'All',        value: 'All'      },
            { label: 'Fruits',     value: 'fruit'    },
            { label: 'Dry Fruits', value: 'dryfruit' },
          ].map(k => (
            <button key={k.value} onClick={() => setActiveFilter(k.value)}
              style={{ flexShrink:0, padding:'6px 16px', borderRadius:20,
                border: activeFilter === k.value ? 'none' : `1.5px solid ${dk.pillBdr}`,
                background: activeFilter === k.value ? '#16a34a' : dk.pillBg,
                color: activeFilter === k.value ? '#fff' : dk.text,
                fontWeight:600, cursor:'pointer', fontSize:'0.82rem', transition:'all 0.2s' }}>
              {k.label}
            </button>
          ))}
          {/* Sort dropdown */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ flexShrink:0, marginLeft:'auto', padding:'6px 10px', borderRadius:20,
              border:`1.5px solid ${dk.pillBdr}`, background:dk.pillBg, color:dk.text,
              fontWeight:600, fontSize:'0.82rem', cursor:'pointer', outline:'none' }}>
            <option value="default">Sort</option>
            <option value="low">Price: Low → High</option>
            <option value="high">Price: High → Low</option>
          </select>
        </div>

        {/* Section title */}
        <h2 style={{ margin:'0 0 12px', fontSize:'1rem', fontWeight:800, color:dk.text }}>
          {activeFilter === 'All' ? 'All Products' : activeFilter === 'fruit' ? 'Fruits' : activeFilter === 'dryfruit' ? 'Dry Fruits' : activeFilter}
        </h2>

        {/* Product grid */}
        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
            {Array.from({length:8}).map((_,i) => (
              <div key={i} style={{ background:dk.card, borderRadius:14, overflow:'hidden', border:`1px solid ${dk.border2}` }}>
                <div style={{ aspectRatio:'1', background:dk.skeletonA, animation:'shimmer 1.4s infinite' }} />
                <div style={{ padding:10 }}>
                  <div style={{ height:10, background:dk.skeletonA, borderRadius:6, marginBottom:6, width:'70%' }} />
                  <div style={{ height:10, background:dk.skeletonA, borderRadius:6, width:'50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:dk.textMuted }}>
            <div style={{ fontSize:'3rem', marginBottom:12 }}>🍎</div>
            <p style={{ fontWeight:700, color:dk.text }}>{search ? `No results for "${search}"` : 'No products yet'}</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12 }}>
            {filtered.map(p => {
              const qty = getQty(p.id);
              const disc = p.discountPercentage || 0;
              const mrp = disc > 0 ? Math.round(p.price / (1 - disc / 100)) : null;
              const outStock = p.quantity === 0;
              return (
                <div key={p.id} style={{ background:dk.card, borderRadius:14, overflow:'hidden', border:`1px solid ${dk.border2}`, display:'flex', flexDirection:'column', boxShadow:dark?'0 2px 8px rgba(0,0,0,0.4)':'0 1px 4px rgba(0,0,0,0.04)', transition:'box-shadow 0.2s' }}>
                  <div style={{ position:'relative', aspectRatio:'1', background:dk.card2, overflow:'hidden' }}>
                    <img src={getImg(p.imageUrl, p.id)} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e => { e.target.src = `https://picsum.photos/seed/${p.id}/300`; }} />
                    {disc >= 10 && <span style={{ position:'absolute', top:6, left:6, background:'#16a34a', color:'#fff', fontSize:'0.65rem', fontWeight:700, padding:'2px 7px', borderRadius:20 }}>{disc}% OFF</span>}
                    {p.quantity > 0 && p.quantity <= 5 && <span style={{ position:'absolute', bottom:6, left:6, background:'#f97316', color:'#fff', fontSize:'0.65rem', fontWeight:700, padding:'2px 7px', borderRadius:20 }}>Only {p.quantity} left</span>}
                    {/* Wishlist heart */}
                    <button onClick={e => { e.stopPropagation(); if (!user) { setShowLogin(true); return; } toggleWishlist(p); }}
                      style={{ position:'absolute', top:6, right:6, width:28, height:28, borderRadius:'50%', background:'rgba(0,0,0,0.35)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted(p.id) ? '#ef4444' : 'none'} stroke={isWishlisted(p.id) ? '#ef4444' : '#fff'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>
                  <div style={{ padding:'10px 10px 12px', flex:1, display:'flex', flexDirection:'column' }}>
                    <span style={{ fontSize:'0.68rem', color:'#16a34a', fontWeight:600, background:dark?'#1a3a2a':'#f0fdf4', padding:'2px 7px', borderRadius:20, width:'fit-content', marginBottom:4 }}>{p.unit || '1 pc'}</span>
                    <p style={{ margin:'0 0 4px', fontSize:'0.82rem', fontWeight:700, color:dk.text, lineHeight:1.3 }}>{p.name}</p>
                    <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8, marginTop:'auto' }}>
                      <span style={{ fontWeight:800, fontSize:'0.95rem', color:dk.text }}>₹{p.price}</span>
                      {mrp && <span style={{ fontSize:'0.72rem', color:dk.textMuted, textDecoration:'line-through' }}>₹{mrp}</span>}
                    </div>
                    {outStock ? (
                      <div style={{ textAlign:'center', padding:'7px', background:dk.card2, borderRadius:10, fontSize:'0.72rem', color:dk.textMuted, fontWeight:600 }}>Out of Stock</div>
                    ) : qty === 0 ? (
                      <button onClick={() => handleAdd(p)}
                        style={{ width:'100%', padding:'7px', border: addedId === p.id ? 'none' : '1.5px solid #16a34a', borderRadius:10, background: addedId === p.id ? '#16a34a' : 'transparent', color: addedId === p.id ? '#fff' : '#16a34a', fontWeight:700, cursor:'pointer', fontSize:'0.82rem', transition:'all 0.2s' }}>
                        {addedId === p.id ? '✓ Added' : '+ Add'}
                      </button>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'#16a34a', borderRadius:10, overflow:'hidden' }}>
                        <button onClick={() => updateQty(p.id, qty - 1)} style={{ width:34, height:34, background:'none', border:'none', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'1rem' }}>−</button>
                        <span style={{ color:'#fff', fontWeight:700, fontSize:'0.85rem' }}>{qty}</span>
                        <button onClick={() => updateQty(p.id, qty + 1)} style={{ width:34, height:34, background:'none', border:'none', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'1rem' }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── CART DRAWER ──────────────────────────────────────────────────── */}
      {showCart && (
        <div style={{ position:'fixed', inset:0, zIndex:500, display:'flex', justifyContent:'flex-end' }} onClick={() => setShowCart(false)}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />
          <div style={{ position:'relative', width:360, maxWidth:'100vw', height:'100%', background:dk.cartBg, display:'flex', flexDirection:'column', boxShadow:'-4px 0 32px rgba(0,0,0,0.3)', animation:'slideIn 0.25s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${dk.border2}` }}>
              <h3 style={{ margin:0, fontWeight:800, color:dk.text }}>My Cart ({count})</h3>
              <button onClick={() => setShowCart(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:dk.textSub }}>✕</button>
            </div>
            {cart.length === 0 ? (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:32, textAlign:'center' }}>
                <div style={{ fontSize:'3rem' }}>🛒</div>
                <p style={{ fontWeight:700, color:dk.text, margin:0 }}>Your cart is empty</p>
                <p style={{ color:dk.textMuted, fontSize:'0.85rem', margin:0 }}>Add some fresh fruits!</p>
                <button onClick={() => setShowCart(false)} style={{ padding:'10px 24px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>Browse Products</button>
              </div>
            ) : (
              <>
                <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, background:dk.cartItem, borderRadius:12, padding:12 }}>
                      <img src={getImg(item.imageUrl, item.id)} alt={item.name} style={{ width:52, height:52, borderRadius:10, objectFit:'cover', flexShrink:0 }}
                        onError={e => { e.target.src = `https://picsum.photos/seed/${item.id}/52`; }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:'0.85rem', color:dk.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</p>
                        <p style={{ margin:0, fontSize:'0.75rem', color:dk.textSub }}>₹{item.price} × {item.qty}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width:28, height:28, borderRadius:8, background:dk.card2, border:'none', cursor:'pointer', fontWeight:700, color:dk.text }}>−</button>
                        <span style={{ width:24, textAlign:'center', fontWeight:700, fontSize:'0.85rem', color:dk.text }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width:28, height:28, borderRadius:8, background:dk.card2, border:'none', cursor:'pointer', fontWeight:700, color:dk.text }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:dk.textMuted, fontSize:'1rem' }}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ padding:16, borderTop:`1px solid ${dk.border2}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <span style={{ fontWeight:700, color:dk.text }}>Total</span>
                    <span style={{ fontWeight:800, fontSize:'1.1rem', color:dk.text }}>₹{total.toFixed(0)}</span>
                  </div>
                  <button onClick={() => { if (!user) { setShowCart(false); setShowLogin(true); } else {
                    setShowCart(false); setCheckoutDone(false); setShowConfirm(false);
                    setUtrNumber(''); setPaymentDone(false);
                    // Pre-fill saved address from profile
                    const saved = user?.address || '';
                    setCheckoutForm({ address: saved, paymentMethod: 'COD' });
                    // Load all saved addresses from profile
                    const stored = localStorage.getItem('user_data');
                    if (stored) {
                      try {
                        const d = JSON.parse(stored);
                        const addrs = [];
                        if (d.address) addrs.push(d.address);
                        setSavedAddresses(addrs);
                      } catch {}
                    }
                    setShowCheckout(true);
                  } }}
                    style={{ width:'100%', padding:'13px', background:'#f97316', color:'#fff', border:'none', borderRadius:12, fontWeight:800, cursor:'pointer', fontSize:'0.95rem' }}>
                    Proceed to Checkout →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── BULK ORDER MODAL ─────────────────────────────────────────────── */}
      {showBulk && (
        <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={closeBulk}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            {bulkOk ? (
              <div style={{ padding:40, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:'3rem' }}>🎉</div>
                <h3 style={{ margin:0, color:'#16a34a', fontWeight:800 }}>Request Received!</h3>
                <p style={{ margin:0, color:'#6b7280' }}>Your bulk order request has been submitted.</p>
                <div style={{ background:'#fff8e1', border:'1px solid #ffe082', borderRadius:10, padding:'12px 16px', fontSize:'0.82rem', color:'#555' }}>
                  Please contact us to confirm price and complete advance payment.
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <a href="tel:+919963983601" style={{ padding:'10px 20px', background:'#16a34a', color:'#fff', borderRadius:10, textDecoration:'none', fontWeight:700, fontSize:'0.85rem' }}>📞 Call Now</a>
                  <a href="https://wa.me/919963983601" target="_blank" rel="noreferrer" style={{ padding:'10px 20px', background:'#25d366', color:'#fff', borderRadius:10, textDecoration:'none', fontWeight:700, fontSize:'0.85rem' }}>💬 WhatsApp</a>
                </div>
                <button onClick={closeBulk} style={{ padding:'10px 32px', background:'#f5f5f5', color:'#555', border:'1.5px solid #e0e0e0', borderRadius:10, cursor:'pointer', fontWeight:600 }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 14px', borderBottom:'1px solid #f0f0f0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:'1.6rem' }}>📦</span>
                    <div>
                      <h3 style={{ margin:0, fontWeight:800, fontSize:'1rem' }}>Pre-Book Bulk Order</h3>
                      <p style={{ margin:0, fontSize:'0.72rem', color:'#888' }}>Place bulk orders in advance • Prices may vary daily</p>
                    </div>
                  </div>
                  <button onClick={closeBulk} style={{ background:'none', border:'none', cursor:'pointer', color:'#888', fontSize:'1.1rem' }}>✕</button>
                </div>
                <form onSubmit={submitBulk} style={{ padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#333' }}>Fruit <span style={{ color:'#e53935' }}>*</span></label>
                      <select value={bulkForm.fruit} onChange={e => setBulkForm({...bulkForm, fruit:e.target.value})} required
                        style={{ padding:'8px 10px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.82rem', outline:'none' }}>
                        <option value="">Select</option>
                        {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#333' }}>Quantity <span style={{ color:'#e53935' }}>*</span></label>
                      <div style={{ display:'flex', gap:4 }}>
                        <input type="number" min="1" value={bulkForm.qty} onChange={e => setBulkForm({...bulkForm, qty:e.target.value})} placeholder="Qty" required
                          style={{ flex:1, padding:'8px 8px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.82rem', outline:'none', minWidth:0 }} />
                        <select value={bulkForm.unit} onChange={e => setBulkForm({...bulkForm, unit:e.target.value})}
                          style={{ width:60, padding:'8px 4px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.75rem', outline:'none' }}>
                          <option value="kg">kg</option><option value="dozen">Dozen</option><option value="piece">Piece</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#333' }}>Delivery Date <span style={{ color:'#e53935' }}>*</span></label>
                      <input type="date" value={bulkForm.date} min={new Date().toISOString().split('T')[0]} onChange={e => setBulkForm({...bulkForm, date:e.target.value})} required
                        style={{ padding:'8px 10px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.82rem', outline:'none' }} />
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <label style={{ fontSize:'0.72rem', fontWeight:700, color:'#333' }}>Notes <span style={{ fontSize:'0.68rem', color:'#aaa', fontWeight:400 }}>(Optional)</span></label>
                    <textarea value={bulkForm.notes} onChange={e => setBulkForm({...bulkForm, notes:e.target.value})} placeholder="Special instructions…" rows={2} maxLength={200}
                      style={{ padding:'10px 12px', border:'1.5px solid #e0e0e0', borderRadius:8, fontSize:'0.82rem', outline:'none', resize:'vertical' }} />
                  </div>
                  <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 14px', fontSize:'0.78rem', color:'#444' }}>
                    <strong style={{ color:'#16a34a' }}>Bulk Order Info:</strong> Min 10kg (Fruits) • Banana 24 Dozen • Dry Fruits 3kg • Min value ₹1500 • <strong>Advance payment required</strong>
                  </div>
                  <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer', fontSize:'0.75rem', color:'#555' }}>
                    <input type="checkbox" checked={bulkForm.agreed} onChange={e => setBulkForm({...bulkForm, agreed:e.target.checked})} style={{ marginTop:2, accentColor:'#16a34a' }} />
                    I understand that bulk order prices may vary & advance payment is required.
                  </label>
                  {bulkErr && <p style={{ margin:0, color:'#c62828', background:'#ffebee', border:'1px solid #ffcdd2', borderRadius:8, padding:'8px 12px', fontSize:'0.8rem' }}>⚠️ {bulkErr}</p>}
                  <div style={{ display:'flex', gap:10 }}>
                    <button type="button" onClick={closeBulk} style={{ padding:'12px 20px', background:'#fff', color:'#555', border:'1.5px solid #e0e0e0', borderRadius:10, cursor:'pointer', fontWeight:600 }}>Cancel</button>
                    <button type="submit" disabled={bulkSaving} style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity: bulkSaving ? 0.7 : 1 }}>
                      {bulkSaving ? 'Placing…' : 'Proceed to Pay Advance'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── LOGIN PROMPT MODAL ───────────────────────────────────────────── */}
      {showLogin && (
        <div style={{ position:'fixed', inset:0, zIndex:700, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={() => setShowLogin(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, maxWidth:360, width:'100%', textAlign:'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:'2.5rem', marginBottom:12 }}>🍎</div>
            <h3 style={{ margin:'0 0 8px', fontWeight:800 }}>Login to Continue</h3>
            <p style={{ margin:'0 0 20px', color:'#6b7280', fontSize:'0.85rem' }}>Please login to add items to your cart</p>
            <button onClick={() => { setShowLogin(false); navigate('/login'); }}
              style={{ width:'100%', padding:'12px', background:'#16a34a', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer', fontSize:'0.95rem' }}>
              Login / Sign Up
            </button>
          </div>
        </div>
      )}

      {/* ── CHECKOUT MODAL — 2-step: review → confirm ────────────────────── */}
      {showCheckout && (
        <div style={{ position:'fixed', inset:0, zIndex:700, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={() => !checkoutLoading && setShowCheckout(false)}>
          <div style={{ background:dk.modalBg, borderRadius:18, width:'100%', maxWidth:460, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>

            {checkoutDone ? (
              <div style={{ padding:40, textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
                <div style={{ fontSize:'3.5rem' }}>🎉</div>
                <h3 style={{ margin:0, color:'#16a34a', fontWeight:800, fontSize:'1.2rem' }}>Order Placed!</h3>
                <p style={{ margin:0, color:dk.textSub, fontSize:'0.9rem' }}>Invoice downloaded automatically.</p>
                <button onClick={() => { setShowCheckout(false); navigate('/orders'); }}
                  style={{ padding:'12px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:12, fontWeight:700, cursor:'pointer' }}>
                  View My Orders
                </button>
                <button onClick={() => setShowCheckout(false)}
                  style={{ padding:'10px 24px', background:dk.card2, color:dk.text, border:`1.5px solid ${dk.border}`, borderRadius:12, fontWeight:600, cursor:'pointer' }}>
                  Continue Shopping
                </button>
              </div>

            ) : !showConfirm ? (
              /* Step 1 — cart review + address + payment */
              <>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 14px', borderBottom:`1px solid ${dk.border2}` }}>
                  <h3 style={{ margin:0, fontWeight:800, fontSize:'1rem', color:dk.text }}>Review Order</h3>
                  <button onClick={() => setShowCheckout(false)} style={{ background:'none', border:'none', cursor:'pointer', color:dk.textMuted, fontSize:'1.1rem' }}>✕</button>
                </div>
                <div style={{ padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ background:dk.card2, borderRadius:12, padding:14 }}>
                    <p style={{ margin:'0 0 10px', fontWeight:700, fontSize:'0.85rem', color:dk.text }}>Your Items</p>
                    {cart.map(item => (
                      <div key={item.id} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:dk.textSub, marginBottom:4 }}>
                        <span>{item.name} × {item.qty}</span>
                        <span style={{ fontWeight:700, color:dk.text }}>₹{(item.price*item.qty).toFixed(0)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop:`1px dashed ${dk.border}`, marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:800, color:dk.text }}>
                      <span>Total</span><span>₹{total.toFixed(0)}</span>
                    </div>
                  </div>
                  {/* Suggest more */}
                  {products.filter(p => !cart.find(c=>c.id===p.id) && p.quantity>0).slice(0,4).length > 0 && (
                    <div>
                      <p style={{ margin:'0 0 8px', fontSize:'0.78rem', fontWeight:700, color:dk.textSub }}>🛒 Add more before ordering?</p>
                      <div style={{ display:'flex', gap:8, overflowX:'auto' }}>
                        {products.filter(p => !cart.find(c=>c.id===p.id) && p.quantity>0).slice(0,4).map(p => (
                          <button key={p.id} onClick={() => { addToCart(p); showToast(`${p.name} added`); }}
                            style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'8px 10px', background:dk.card2, border:`1px solid ${dk.border}`, borderRadius:10, cursor:'pointer', minWidth:72 }}>
                            <img src={getImg(p.imageUrl,p.id)} alt={p.name} style={{ width:40, height:40, borderRadius:8, objectFit:'cover' }} onError={e=>{e.target.src=`https://picsum.photos/seed/${p.id}/40`;}} />
                            <span style={{ fontSize:'0.65rem', fontWeight:600, color:dk.text, textAlign:'center', lineHeight:1.2 }}>{p.name}</span>
                            <span style={{ fontSize:'0.65rem', color:'#16a34a', fontWeight:700 }}>+₹{p.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize:'0.78rem', fontWeight:700, color:dk.textSub, display:'block', marginBottom:6 }}>Delivery Address <span style={{ color:'#e53935' }}>*</span></label>

                    {/* Saved address chips */}
                    {savedAddresses.length > 0 && (
                      <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
                        {savedAddresses.map((addr, i) => (
                          <button key={i} type="button"
                            onClick={() => setCheckoutForm({...checkoutForm, address: addr})}
                            style={{ textAlign:'left', padding:'9px 12px', borderRadius:10,
                              border:`2px solid ${checkoutForm.address === addr ? '#16a34a' : dk.border}`,
                              background: checkoutForm.address === addr ? (dark?'#1a3a2a':'#f0fdf4') : dk.card2,
                              color: checkoutForm.address === addr ? '#16a34a' : dk.text,
                              fontSize:'0.8rem', cursor:'pointer', fontWeight: checkoutForm.address === addr ? 700 : 400 }}>
                            📍 {addr}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Use live location button */}
                    <button type="button" disabled={locLoading}
                      onClick={() => {
                        if (!navigator.geolocation) return;
                        setLocLoading(true);
                        navigator.geolocation.getCurrentPosition(pos => {
                          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
                            .then(r => r.json())
                            .then(d => {
                              const a = d.address;
                              const parts = [
                                a.house_number, a.road || a.pedestrian,
                                a.suburb || a.neighbourhood || a.village,
                                a.city || a.town || a.county,
                                a.state, a.postcode
                              ].filter(Boolean);
                              const liveAddr = parts.join(', ');
                              setCheckoutForm(f => ({...f, address: liveAddr}));
                              // Save to savedAddresses if not already there
                              setSavedAddresses(prev => prev.includes(liveAddr) ? prev : [liveAddr, ...prev].slice(0,3));
                            })
                            .catch(() => {})
                            .finally(() => setLocLoading(false));
                        }, () => setLocLoading(false));
                      }}
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', marginBottom:8,
                        background:'transparent', border:`1.5px solid ${dk.border}`, borderRadius:10,
                        color:'#16a34a', fontWeight:600, fontSize:'0.78rem', cursor:'pointer', width:'100%' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {locLoading ? 'Getting location…' : 'Use my current location'}
                    </button>

                    {/* Manual address input */}
                    <textarea value={checkoutForm.address} onChange={e => setCheckoutForm({...checkoutForm, address:e.target.value})}
                      placeholder="Or type: House no, Street, City, State, PIN" rows={3}
                      style={{ width:'100%', padding:'11px 14px', border:`1.5px solid ${dk.inputBdr}`, borderRadius:10, fontSize:'0.85rem', outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', background:dk.inputBg, color:dk.text }} />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.78rem', fontWeight:700, color:dk.textSub, display:'block', marginBottom:8 }}>Payment Method</label>
                    <div style={{ display:'flex', gap:10 }}>
                      {[{val:'COD',label:'💵 Cash on Delivery'},{val:'ONLINE',label:'📱 Online Payment'}].map(opt => (
                        <button key={opt.val} type="button" onClick={() => { setCheckoutForm({...checkoutForm, paymentMethod:opt.val}); setUtrNumber(''); setPaymentDone(false); }}
                          style={{ flex:1, padding:'10px', border:`2px solid ${checkoutForm.paymentMethod===opt.val?'#16a34a':dk.border}`, borderRadius:10, background:checkoutForm.paymentMethod===opt.val?(dark?'#1a3a2a':'#f0fdf4'):dk.card2, color:checkoutForm.paymentMethod===opt.val?'#16a34a':dk.text, fontWeight:700, cursor:'pointer', fontSize:'0.78rem' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button disabled={!checkoutForm.address.trim()} onClick={() => setShowConfirm(true)}
                    style={{ padding:'13px', background:'#f97316', color:'#fff', border:'none', borderRadius:12, fontWeight:800, cursor:'pointer', fontSize:'0.95rem', opacity:!checkoutForm.address.trim()?0.5:1 }}>
                    Review & Confirm →
                  </button>
                </div>
              </>

            ) : (
              /* Step 2 — final confirm + payment details */
              <>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'16px 20px 14px', borderBottom:`1px solid ${dk.border2}` }}>
                  <button onClick={() => setShowConfirm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:dk.textSub, display:'flex' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <h3 style={{ margin:0, fontWeight:800, fontSize:'1rem', color:dk.text, flex:1 }}>Confirm Order</h3>
                </div>
                <div style={{ padding:'16px 20px 20px', display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ background:dk.card2, borderRadius:12, padding:14 }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:dk.textSub, marginBottom:4 }}>
                        <span>{item.name} × {item.qty}</span>
                        <span style={{ fontWeight:700, color:dk.text }}>₹{(item.price*item.qty).toFixed(0)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop:`1px dashed ${dk.border}`, marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:800, color:dk.text }}>
                      <span>Total</span><span style={{ color:'#16a34a', fontSize:'1.05rem' }}>₹{total.toFixed(0)}</span>
                    </div>
                    <p style={{ margin:'6px 0 0', fontSize:'0.75rem', color:dk.textSub }}>📍 {checkoutForm.address} · {checkoutForm.paymentMethod==='COD'?'💵 Cash on Delivery':'📱 Online Payment'}</p>
                  </div>

                  {/* Online payment details from admin */}
                  {checkoutForm.paymentMethod === 'ONLINE' && (
                    <div style={{ background:dark?'#1a2a1a':'#f0fdf4', border:`1.5px solid ${dark?'#2d4a2d':'#bbf7d0'}`, borderRadius:12, padding:14 }}>
                      <p style={{ margin:'0 0 10px', fontWeight:700, fontSize:'0.85rem', color:'#16a34a' }}>📱 Pay Now — then enter UTR below</p>
                      {paymentSettings?.qrImage && (
                        <div style={{ textAlign:'center', marginBottom:10 }}>
                          <a href={paymentSettings?.upiId ? `upi://pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(paymentSettings.upiName||'KSR Fruits')}&cu=INR&am=${total.toFixed(2)}` : '#'}
                            style={{ display:'inline-block' }}>
                            <img src={paymentSettings.qrImage} alt="Scan to Pay" style={{ width:150, height:150, borderRadius:10, objectFit:'contain', border:`1px solid ${dk.border}` }} />
                          </a>
                          <p style={{ margin:'4px 0 0', fontSize:'0.72rem', color:dk.textSub }}>Tap QR to open payment app</p>
                        </div>
                      )}
                      {paymentSettings?.upiId && (
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginBottom:10 }}>
                          {[
                            { name:'GPay',    color:'#4285F4', scheme:`tez://upi/pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(paymentSettings.upiName||'KSR Fruits')}&cu=INR&am=${total.toFixed(2)}` },
                            { name:'PhonePe', color:'#5f259f', scheme:`phonepe://pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(paymentSettings.upiName||'KSR Fruits')}&cu=INR&am=${total.toFixed(2)}` },
                            { name:'Paytm',   color:'#00BAF2', scheme:`paytmmp://pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(paymentSettings.upiName||'KSR Fruits')}&cu=INR&am=${total.toFixed(2)}` },
                            { name:'BHIM',    color:'#FF6600', scheme:`upi://pay?pa=${paymentSettings.upiId}&pn=${encodeURIComponent(paymentSettings.upiName||'KSR Fruits')}&cu=INR&am=${total.toFixed(2)}` },
                          ].map(app => (
                            <a key={app.name} href={app.scheme}
                              style={{ padding:'8px 14px', background:app.color, color:'#fff', borderRadius:8, fontWeight:700, fontSize:'0.78rem', textDecoration:'none', display:'inline-block' }}>
                              {app.name}
                            </a>
                          ))}
                        </div>
                      )}
                      {paymentSettings?.upiId && (
                        <div style={{ background:dk.card, borderRadius:8, padding:'8px 12px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ fontSize:'0.8rem', color:dk.textSub }}>UPI ID</span>
                          <span style={{ fontWeight:700, fontSize:'0.85rem', color:dk.text }}>{paymentSettings.upiId}</span>
                        </div>
                      )}
                      {paymentSettings?.bankName && [['Bank',paymentSettings.bankName],['Account Holder',paymentSettings.accountHolder],['Account No.',paymentSettings.accountNumber],['IFSC',paymentSettings.ifscCode]].filter(([,v])=>v).map(([k,v]) => (
                        <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', marginBottom:3 }}>
                          <span style={{ color:dk.textSub }}>{k}</span>
                          <span style={{ fontWeight:600, color:dk.text }}>{v}</span>
                        </div>
                      ))}
                      {paymentSettings?.instructions && <p style={{ margin:'8px 0 0', fontSize:'0.75rem', color:dk.textSub, fontStyle:'italic' }}>{paymentSettings.instructions}</p>}
                      {!paymentSettings?.upiId && !paymentSettings?.bankName && <p style={{ margin:0, fontSize:'0.82rem', color:dk.textSub }}>Contact ksrfruitshelp@gmail.com for payment details.</p>}

                      {/* ── UTR / Transaction ID confirmation ── */}
                      <div style={{ marginTop:14, borderTop:`1px dashed ${dark?'#2d4a2d':'#bbf7d0'}`, paddingTop:12 }}>
                        <p style={{ margin:'0 0 8px', fontWeight:700, fontSize:'0.82rem', color:dk.text }}>
                          ✅ After paying, enter your UTR / Transaction ID
                        </p>
                        <input
                          value={utrNumber}
                          onChange={e => { setUtrNumber(e.target.value); setPaymentDone(e.target.value.trim().length >= 6); }}
                          placeholder="e.g. 407812345678 or T2506XXXXXXX"
                          style={{ width:'100%', padding:'10px 12px', border:`1.5px solid ${utrNumber.trim().length >= 6 ? '#16a34a' : dk.inputBdr}`, borderRadius:10, fontSize:'0.85rem', outline:'none', boxSizing:'border-box', background:dk.inputBg, color:dk.text, fontFamily:'inherit' }}
                        />
                        <p style={{ margin:'5px 0 0', fontSize:'0.7rem', color:dk.textSub }}>
                          Find UTR in your payment app → Transaction details. Min 6 characters.
                        </p>
                        {paymentDone && (
                          <div style={{ marginTop:8, padding:'8px 12px', background:dark?'#1a3a2a':'#dcfce7', borderRadius:8, fontSize:'0.78rem', color:'#16a34a', fontWeight:600 }}>
                            ✓ Payment reference recorded — you can now place the order
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button disabled={checkoutLoading || (checkoutForm.paymentMethod === 'ONLINE' && !paymentDone)}
                    onClick={async () => {
                      setCheckoutLoading(true);
                      const cartSnapshot = [...cart];
                      const totalSnapshot = total;
                      try {
                        const res = await orderApi.post('/api/orders', {
                          userId: user.userId, totalAmount: total,
                          deliveryAddress: checkoutForm.address,
                          paymentMethod: checkoutForm.paymentMethod,
                          // Include UTR in paymentId field for admin visibility
                          paymentId: checkoutForm.paymentMethod === 'ONLINE' ? utrNumber.trim() : 'COD',
                          items: cart.map(i => ({ productId:i.id, productName:i.name, quantity:i.qty, price:i.price })),
                        });
                        // Save address for next time
                        if (checkoutForm.address.trim()) {
                          setSavedAddresses(prev => {
                            const updated = [checkoutForm.address, ...prev.filter(a => a !== checkoutForm.address)].slice(0,3);
                            // Persist to user profile in localStorage
                            try {
                              const d = JSON.parse(localStorage.getItem('user_data') || '{}');
                              d.address = checkoutForm.address;
                              localStorage.setItem('user_data', JSON.stringify(d));
                            } catch {}
                            return updated;
                          });
                        }
                        await clearCart();
                        setCheckoutDone(true); setShowConfirm(false);
                        generateInvoice(res.data, cartSnapshot, totalSnapshot, checkoutForm);
                      } catch { alert('Failed to place order. Please try again.'); }
                      finally { setCheckoutLoading(false); }
                    }}
                    style={{ padding:'13px', background: checkoutForm.paymentMethod === 'ONLINE' && !paymentDone ? '#9ca3af' : '#16a34a', color:'#fff', border:'none', borderRadius:12, fontWeight:800, cursor: checkoutForm.paymentMethod === 'ONLINE' && !paymentDone ? 'not-allowed' : 'pointer', fontSize:'0.95rem', opacity:checkoutLoading?0.6:1, transition:'background 0.2s' }}>
                    {checkoutLoading ? 'Placing Order…'
                      : checkoutForm.paymentMethod === 'ONLINE' && !paymentDone
                        ? '🔒 Enter UTR to Place Order'
                        : `✓ Place Order · ₹${total.toFixed(0)}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── BUY AGAIN MODAL ──────────────────────────────────────────────── */}
      {showBuyAgain && (
        <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={() => setShowBuyAgain(false)}>
          <div style={{ background:dk.modalBg, borderRadius:'20px 20px 0 0', width:'100%', maxWidth:480, maxHeight:'70vh', display:'flex', flexDirection:'column', boxShadow:'0 -8px 32px rgba(0,0,0,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:`1px solid ${dk.border2}`, flexShrink:0 }}>
              <h3 style={{ margin:0, fontWeight:800, fontSize:'1rem', color:dk.text }}>🔁 Buy Again</h3>
              <button onClick={() => setShowBuyAgain(false)} style={{ background:'none', border:'none', cursor:'pointer', color:dk.textMuted, fontSize:'1.1rem' }}>✕</button>
            </div>
            <div style={{ overflowY:'auto', padding:'12px 16px 24px', flex:1 }}>
              {pastOrders.length === 0 ? (
                <div style={{ textAlign:'center', padding:'32px 0', color:dk.textMuted }}>
                  <div style={{ fontSize:'2.5rem', marginBottom:8 }}>📦</div>
                  <p style={{ margin:0, fontWeight:600, color:dk.text }}>No past orders yet</p>
                  <p style={{ margin:'4px 0 0', fontSize:'0.8rem' }}>Your previous orders will appear here</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {pastOrders.flatMap(o => o.items || []).reduce((acc, item) => {
                    if (!acc.find(x => x.productId === item.productId)) acc.push(item);
                    return acc;
                  }, []).map(item => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div key={item.productId} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', background:dk.cartItem, borderRadius:12 }}>
                        <img src={getImg(prod?.imageUrl, item.productId)} alt={item.productName}
                          style={{ width:44, height:44, borderRadius:10, objectFit:'cover', flexShrink:0 }}
                          onError={e => { e.target.src = `https://picsum.photos/seed/${item.productId}/44`; }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:0, fontWeight:700, fontSize:'0.85rem', color:dk.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.productName}</p>
                          <p style={{ margin:0, fontSize:'0.75rem', color:dk.textMuted }}>₹{item.price} · {prod?.unit || ''}</p>
                        </div>
                        {prod && !prod.quantity === 0 ? (
                          <span style={{ fontSize:'0.72rem', color:'#9ca3af', fontWeight:600 }}>Out of stock</span>
                        ) : (
                          <button onClick={() => { if (prod) { handleAdd(prod); showToast(`${prod.name} added`); } }}
                            style={{ padding:'6px 14px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:'0.78rem', cursor:'pointer', flexShrink:0 }}>
                            + Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV — Home + Buy Again + Cart ──────────────────── */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, background:dk.navBg, borderTop:`1px solid ${dk.border}`, display:'flex', zIndex:200, boxShadow:'0 -2px 12px rgba(0,0,0,0.15)', paddingBottom:'env(safe-area-inset-bottom,0px)' }} className="show-mobile-only">
        {/* Home */}
        <button onClick={() => window.scrollTo({top:0,behavior:'smooth'})}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 4px', background:'none', border:'none', cursor:'pointer', fontSize:'0.6rem', color:'#16a34a', fontWeight:700 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Home
        </button>
        {/* Buy Again */}
        <button onClick={() => {
            if (!user) { navigate('/login'); return; }
            orderApi.get(`/api/orders/my?userId=${user.userId}`)
              .then(r => setPastOrders(r.data || []))
              .catch(() => setPastOrders([]));
            setShowBuyAgain(true);
          }}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 4px', background:'none', border:'none', cursor:'pointer', fontSize:'0.6rem', color:dk.textSub, fontWeight:600 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
          Buy Again
        </button>
        {/* Cart */}
        <button onClick={() => setShowCart(true)}
          style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'8px 4px', background:'none', border:'none', cursor:'pointer', fontSize:'0.6rem', color:dk.textSub, fontWeight:600, position:'relative' }}>
          <span style={{ position:'relative', display:'inline-flex' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {count > 0 && <span style={{ position:'absolute', top:-6, right:-8, background:'#16a34a', color:'#fff', borderRadius:'50%', minWidth:16, height:16, fontSize:'0.55rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid #fff' }}>{count > 9 ? '9+' : count}</span>}
          </span>
          Cart
        </button>
      </nav>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes shimmer { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .hide-mobile { display: flex !important; }
        .show-mobile-only { display: none !important; }
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .show-mobile-only { display: flex !important; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>
    </div>
  );
}
