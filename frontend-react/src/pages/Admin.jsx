import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBanners } from '../context/BannerContext';
import ProfitCalculator from './ProfitCalculator';
import AdminNav from '../components/AdminNav';
import st from './Admin.module.css';
import { getToken } from '../api/tokenHelper';

const BASE         = import.meta.env.VITE_API_BASE ?? '';
const PRODUCT_API  = `${BASE}/api/products`;
const BENEFIT_API  = `${BASE}/api/benefits`;
const ORDER_API    = `${BASE}/api/admin/orders`;
const HELP_API     = `${BASE}/api/help`;
const ABOUT_API    = `${BASE}/api/about`;
const VARIANT_API  = (pid) => `${BASE}/api/products/${pid}/variants`;

const EMPTY_VARIANT = { size:'', price:'', discountPercentage:0, quantity:0 };

const getImg = (url, seed) => {
  if (!url) return `https://picsum.photos/seed/${seed}/50/50`;
  if (url.startsWith('data:')) return url; // base64
  if (url.includes('unsplash.com/photos')) return `https://images.unsplash.com/photo-${url.split('/photos/')[1]}`;
  return url;
};

const STATUS_COLORS = {
  PLACED:           { bg:'#fff8e1', color:'#f57f17', border:'#ffe082' },
  ACCEPTED:         { bg:'#e3f2fd', color:'#1565c0', border:'#90caf9' },
  OUT_FOR_DELIVERY: { bg:'#f3e5f5', color:'#6a1b9a', border:'#ce93d8' },
  DELIVERED:        { bg:'#e8f5e9', color:'#2e7d32', border:'#c8e6c9' },
  CANCELLED:        { bg:'#ffebee', color:'#c62828', border:'#ffcdd2' },
};

const EMPTY_FORM = { name:'', price:'', unit:'', discountPercentage:0, imageUrl:'', quantity:0, category:'fruit', description:'' };

export default function Admin() {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const [tab, setTab] = useState('orders');
  const [showCalc, setShowCalc] = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // ── Products ───────────────────────────────────────────────────────────
  const [products,   setProducts]   = useState([]);
  const [prodLoad,   setProdLoad]   = useState(true);
  const [prodErr,    setProdErr]    = useState('');
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [variants,   setVariants]   = useState([{ ...EMPTY_VARIANT }]);
  // ── Benefits ───────────────────────────────────────────────────────────
  const [benefits,   setBenefits]   = useState([]);
  const [benLoad,    setBenLoad]    = useState(true);
  const [benErr,     setBenErr]     = useState('');
  const [benForm,    setBenForm]    = useState({ productId:'', productName:'', title:'', description:'' });
  const [editingBen, setEditingBen] = useState(null); // id being edited
  const [savingBen,  setSavingBen]  = useState(false);

  // ── Orders ─────────────────────────────────────────────────────────────
  const [orders,     setOrders]     = useState([]);
  const [ordLoad,    setOrdLoad]    = useState(true);
  const [ordErr,     setOrdErr]     = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // ── Help & Support ─────────────────────────────────────────────────────
  const [helpFaqs,   setHelpFaqs]   = useState([]);
  const [helpLoad,   setHelpLoad]   = useState(true);
  const [helpErr,    setHelpErr]    = useState('');
  const [helpForm,   setHelpForm]   = useState({ title:'', description:'', contactEmail:'', contactPhone:'', additionalNotes:'' });
  const [editingHelp, setEditingHelp] = useState(null);
  const [savingHelp, setSavingHelp] = useState(false);

  // ── About Us ───────────────────────────────────────────────────────────
  const [aboutUs,    setAboutUs]    = useState([]);
  const [aboutLoad,  setAboutLoad]  = useState(true);
  const [aboutErr,   setAboutErr]   = useState('');
  const [aboutForm,  setAboutForm]  = useState({ title:'', description:'' });
  const [editingAbout, setEditingAbout] = useState(null);
  const [savingAbout, setSavingAbout] = useState(false);

  // ── Bulk Orders ────────────────────────────────────────────────────────
  const [bulkOrders, setBulkOrders] = useState([]);
  const [bulkLoad,   setBulkLoad]   = useState(false);

  // ── Payment Settings ───────────────────────────────────────────────────
  const [payForm, setPayForm] = useState({ upiId:'', upiName:'', qrImage:'', bankName:'', accountHolder:'', accountNumber:'', ifscCode:'', branch:'', instructions:'' });
  const [payLoad, setPayLoad] = useState(false);
  const [paySaved, setPaySaved] = useState(false);

  // ── Admin Invoice Modal ─────────────────────────────────────────────────
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const adminInvoiceRef = useRef(null);

  // ── Banners ────────────────────────────────────────────────────────────
  const { banners, addBanner, updateBanner, deleteBanner, reorderBanners, resetToDefault } = useBanners();
  const EMPTY_BANNER = { imageUrl:'', title:'', subtitle:'', tag:'', badges:'' };
  const [bannerForm, setBannerForm] = useState(EMPTY_BANNER);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    if (!bannerForm.title) return showToast('Title is required.', 'error');
    if (!bannerForm.imageUrl) return showToast('Please upload an image or enter an image URL.', 'error');
    const data = {
      ...bannerForm,
      badges: bannerForm.badges ? bannerForm.badges.split(',').map(b => b.trim()).filter(Boolean) : [],
    };
    try {
      if (editingBanner !== null) {
        await updateBanner(editingBanner, data);
        showToast('Banner updated!');
      } else {
        await addBanner(data);
        showToast('Banner added!');
      }
      setBannerForm(EMPTY_BANNER); setBannerPreview(''); setEditingBanner(null);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data || err?.message || 'Unknown error';
      showToast(`Failed: ${msg}`, 'error');
    }
  };

  const startEditBanner = (b) => {
    setEditingBanner(b.id);
    setBannerForm({ imageUrl: typeof b.imageUrl === 'string' ? b.imageUrl : '', title: b.title||'', subtitle: b.subtitle||'', tag: b.tag||'', badges: (b.badges||[]).join(', ') });
    setBannerPreview(typeof b.imageUrl === 'string' ? b.imageUrl : '');
    setTab('banners');
  };

  useEffect(() => {
    // Admin always uses light mode — strip user dark mode
    document.documentElement.classList.remove('dark');
    fetchProducts(); fetchOrders(); fetchBenefits(); fetchHelp(); fetchAbout(); fetchPaymentSettings();
  }, []);

  // ── Product CRUD ───────────────────────────────────────────────────────
  const fetchProducts = async () => {
    setProdLoad(true);
    try { const r = await fetch(PRODUCT_API); setProducts(await r.json()); }
    catch { setProdErr('Could not load products.'); }
    finally { setProdLoad(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return setProdErr('Name and price are required');
    setSaving(true); setProdErr('');
    try {
      const token = getToken();
      const res = await fetch(PRODUCT_API, {
        method:'POST',
        headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
        body: JSON.stringify({
          name: form.name, price: parseFloat(form.price),
          unit: form.unit||'kg',
          discountPercentage: parseInt(form.discountPercentage)||0,
          imageUrl: form.imageUrl||null,
          quantity: parseInt(form.quantity)||0,
          category: form.category||'fruit',
          description: form.description||null,
          active: true,
        }),
      });
      if (!res.ok) { const err=await res.json().catch(()=>({})); throw new Error(err.error||`Error ${res.status}`); }
      const created = await res.json();
      // save variants if any filled
      const filledVariants = variants.filter(v => v.size && v.price);
      if (filledVariants.length > 0) {
        await fetch(VARIANT_API(created.id) + '/replace', {
          method:'PUT',
          headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
          body: JSON.stringify(filledVariants.map(v=>({
            size: v.size, price: parseFloat(v.price),
            discountPercentage: parseInt(v.discountPercentage)||0,
            quantity: parseInt(v.quantity)||0,
          }))),
        });
      }
      setForm(EMPTY_FORM); setVariants([{ ...EMPTY_VARIANT }]); fetchProducts();
      showToast(`"${form.name}" added!`);
    } catch(e) {
      setProdErr(e.message==='Failed to fetch'?'Cannot connect to product service (port 8082).':e.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await fetch(`${PRODUCT_API}/${id}`,{method:'DELETE'});
      fetchProducts(); showToast(`"${name}" deleted.`);
    } catch { setProdErr('Delete failed.'); }
  };

  const updateStock = async (id, quantity) => {
    try {
      const token = getToken();
      const res = await fetch(`${PRODUCT_API}/${id}/stock?quantity=${quantity}`,{
        method:'PUT', headers:{...(token?{Authorization:`Bearer ${token}`}:{})},
      });
      if (!res.ok) throw new Error();
      fetchProducts(); showToast('Stock updated!');
    } catch { setProdErr('Stock update failed.'); }
  };

  const handleImageEdit = async (id, imageUrl) => {
    const p = products.find(x=>x.id===id); if(!p) return;
    try {
      const token = getToken();
      await fetch(`${PRODUCT_API}/${id}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
        body: JSON.stringify({...p, imageUrl}),
      });
      fetchProducts();
    } catch { setProdErr('Image update failed.'); }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // ── Benefits CRUD ──────────────────────────────────────────────────────
  const fetchBenefits = async () => {
    setBenLoad(true);
    try { const r = await fetch(BENEFIT_API); setBenefits(await r.json()); }
    catch { setBenErr('Could not load benefits.'); }
    finally { setBenLoad(false); }
  };

  const handleBenSubmit = async (e) => {
    e.preventDefault();
    if (!benForm.productId || !benForm.title) return setBenErr('Product and title are required');
    setSavingBen(true); setBenErr('');
    try {
      const token = getToken();
      const url   = editingBen ? `${BENEFIT_API}/${editingBen}` : BENEFIT_API;
      const method = editingBen ? 'PUT' : 'POST';
      const res = await fetch(url,{
        method,
        headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},
        body: JSON.stringify({
          productId: parseInt(benForm.productId),
          productName: benForm.productName,
          title: benForm.title,
          description: benForm.description,
        }),
      });
      if (!res.ok) throw new Error();
      setBenForm({productId:'',productName:'',title:'',description:''});
      setEditingBen(null); fetchBenefits();
      showToast(editingBen?'Benefit updated!':'Benefit added!');
    } catch { setBenErr('Save failed.'); }
    finally { setSavingBen(false); }
  };

  const startEditBen = (b) => {
    setEditingBen(b.id);
    setBenForm({productId:b.productId,productName:b.productName||'',title:b.title,description:b.description||''});
    setTab('benefits');
  };

  const deleteBen = async (id) => {
    if (!confirm('Delete this benefit?')) return;
    try {
      await fetch(`${BENEFIT_API}/${id}`,{method:'DELETE'});
      fetchBenefits(); showToast('Benefit deleted.');
    } catch { setBenErr('Delete failed.'); }
  };

  // ── Orders ─────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    setOrdLoad(true); setOrdErr('');
    try {
      const token = getToken();
      const res = await fetch(ORDER_API,{headers:{Authorization:`Bearer ${token}`}});
      if (!res.ok) throw new Error();
      setOrders(await res.json());
    } catch { setOrdErr('Could not load orders. Is order service running on port 8084?'); }
    finally { setOrdLoad(false); }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const token = getToken();
      const res = await fetch(`${ORDER_API}/${id}/status`,{
        method:'PUT',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body: JSON.stringify({status}),
      });
      if (!res.ok) throw new Error();
      setOrders(prev => prev.map(o => o.id === id ? {...o, status} : o));

      if (status === 'ACCEPTED') {
        // Auto-generate invoice when order is accepted
        const acceptedOrder = orders.find(o => o.id === id);
        if (acceptedOrder) {
          const orderWithStatus = { ...acceptedOrder, status: 'ACCEPTED' };
          const html = buildAdminInvoiceHtml(orderWithStatus);
          const win = window.open('', '_blank');
          if (win) {
            win.document.write(html);
            win.document.close();
            setTimeout(() => win.print(), 500);
          }
        }
        showToast('✅ Order Accepted — Invoice generated!');
      } else if (status === 'DELIVERED') {
        showToast('✅ Order Delivered Successfully');
      } else if (status === 'CANCELLED') {
        showToast('Order cancelled.', 'error');
      } else {
        showToast(`Status updated to ${status.replace(/_/g,' ')}`);
      }
    } catch { showToast('Status update failed.','error'); }
    finally { setUpdatingId(null); }
  };

  const sc = (s) => STATUS_COLORS[s]||{bg:'#f5f5f5',color:'#555',border:'#e0e0e0'};

  const printAdminInvoice = () => {
    if (!invoiceOrder) return;
    const html = buildAdminInvoiceHtml(invoiceOrder);
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const downloadAdminInvoice = () => {
    if (!invoiceOrder) return;
    const html = buildAdminInvoiceHtml(invoiceOrder);
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `KSR-Invoice-${invoiceOrder.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function buildAdminInvoiceHtml(order) {
    const rows = (order.items || []).map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.productName || `Product #${item.productId}`}</td>
        <td>${item.quantity}</td>
        <td>₹${parseFloat(item.price).toFixed(2)}</td>
        <td>₹${(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
      </tr>`).join('');

    // Parse delivery address: "Name · Phone | Address"
    const rawAddr = order.deliveryAddress || '';
    let receiverName = `User #${order.userId}`;
    let receiverPhone = '';
    let deliveryAddr = rawAddr;
    const pipeIdx = rawAddr.indexOf(' | ');
    if (pipeIdx > -1) {
      const before = rawAddr.substring(0, pipeIdx);
      deliveryAddr = rawAddr.substring(pipeIdx + 3);
      const dotIdx = before.indexOf(' · ');
      if (dotIdx > -1) {
        receiverName  = before.substring(0, dotIdx).replace(/^\[BULK\] /, '');
        receiverPhone = before.substring(dotIdx + 3);
      } else {
        receiverName = before.replace(/^\[BULK\] /, '');
      }
    }

    const isBulk   = rawAddr.startsWith('[BULK]');
    const payLabel = (order.paymentId || '').toUpperCase() === 'COD' ? 'Cash on Delivery' : 'Online (UPI/GPay)';
    const sc2      = sc(order.status);
    const invoiceNo = `KSR-${order.id}-${Date.now().toString().slice(-4)}`;
    const dateStr   = order.createdAt
      ? new Date(order.createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
      : new Date().toLocaleString('en-IN');

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>KSR Fruits Invoice #${order.id}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Courier New',Courier,monospace;padding:20px;color:#111;max-width:320px;margin:0 auto;background:#fff;font-size:12px}
      .center{text-align:center}
      .brand{font-size:16px;font-weight:900;letter-spacing:1px;color:#16a34a}
      .sub{font-size:10px;color:#555;margin-top:2px}
      .divider{border:none;border-top:1px dashed #999;margin:8px 0}
      .divider-solid{border:none;border-top:2px solid #111;margin:8px 0}
      .row{display:flex;justify-content:space-between;margin:3px 0;font-size:11px}
      .row.bold{font-weight:700;font-size:12px}
      .row.total{font-weight:900;font-size:14px;border-top:2px solid #111;padding-top:6px;margin-top:4px}
      .label{color:#555;font-size:10px;text-transform:uppercase;letter-spacing:.05em;margin-top:6px;margin-bottom:2px}
      .items-header{display:flex;justify-content:space-between;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #111;padding-bottom:4px;margin-bottom:4px}
      .item{display:flex;justify-content:space-between;margin:3px 0;font-size:11px}
      .item-name{flex:1;margin-right:8px}
      .item-qty{width:30px;text-align:center}
      .item-price{width:50px;text-align:right}
      .badge{display:inline-block;padding:1px 8px;border-radius:20px;font-size:10px;font-weight:700;border:1px solid #16a34a;color:#16a34a}
      .thank{text-align:center;font-size:11px;margin-top:8px;font-style:italic;color:#555}
      @media print{body{padding:8px}@page{margin:4mm;size:80mm auto}}
    </style></head>
    <body>
      <div class="center">
        <img src="/logo.png" alt="KSR Fruits" style="width:80px;height:80px;object-fit:contain;margin-bottom:4px" onerror="this.style.display='none'">
        <div class="brand">KSR FRUITS</div>
        <div class="sub">Fresh · Fast · Healthy</div>
        <div class="sub">Warangal, Telangana</div>
        <div class="sub">ksrfruitshelp@gmail.com</div>
      </div>

      <hr class="divider-solid">

      <div class="center">
        <div class="badge">INVOICE</div>
      </div>

      <div style="margin-top:6px">
        <div class="row"><span>Invoice No</span><span><strong>${invoiceNo}</strong></span></div>
        <div class="row"><span>Order ID</span><span><strong>#${order.id}</strong></span></div>
        <div class="row"><span>Date</span><span>${dateStr}</span></div>
        <div class="row"><span>Status</span><span><strong>${order.status}</strong></span></div>
        ${isBulk ? '<div class="row"><span>Type</span><span><strong>BULK ORDER</strong></span></div>' : ''}
      </div>

      <hr class="divider">

      <div class="label">Bill To</div>
      <div style="font-size:11px">
        <div><strong>${receiverName}</strong></div>
        ${receiverPhone ? `<div>${receiverPhone}</div>` : ''}
        <div style="color:#444;margin-top:2px">${deliveryAddr || 'Home Delivery'}</div>
      </div>

      <hr class="divider">

      <div class="label">Payment</div>
      <div class="row"><span>${payLabel}</span>${order.paymentId && order.paymentId !== 'COD' ? `<span>Ref: ${order.paymentId}</span>` : ''}</div>

      <hr class="divider">

      <div class="items-header">
        <span class="item-name">Item</span>
        <span class="item-qty">Qty</span>
        <span class="item-price">Amount</span>
      </div>
      ${(order.items || []).map(item => `
        <div class="item">
          <span class="item-name">${item.productName || `Product #${item.productId}`}</span>
          <span class="item-qty">${item.quantity}</span>
          <span class="item-price">₹${(item.quantity * parseFloat(item.price)).toFixed(0)}</span>
        </div>
        <div style="font-size:10px;color:#777;margin-left:0;margin-bottom:2px">@ ₹${parseFloat(item.price).toFixed(0)} each</div>
      `).join('')}

      <hr class="divider">

      <div class="row"><span>Subtotal</span><span>₹${order.totalAmount}</span></div>
      <div class="row"><span>Delivery</span><span style="color:#16a34a">FREE</span></div>
      <div class="row total"><span>TOTAL</span><span>₹${order.totalAmount}</span></div>

      <hr class="divider-solid">

      <div class="thank">Thank you for shopping with KSR Fruits!<br>Stay healthy, eat fresh 🌿</div>
      <div style="text-align:center;font-size:9px;color:#aaa;margin-top:8px">Printed: ${new Date().toLocaleString('en-IN')}</div>
    </body></html>`;
  }

  const fetchBulkOrders = async () => {
    setBulkLoad(true);
    try {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_ORDER_URL || 'http://localhost:8084'}/bulk-orders`, {
        headers: { ...(token ? { Authorization:`Bearer ${token}` } : {}) }
      });
      if (res.ok) { setBulkOrders(await res.json()); }
      else throw new Error();
    } catch {
      // Fallback to localStorage
      const saved = JSON.parse(localStorage.getItem('bulkOrders') || '[]');
      setBulkOrders(saved.reverse());
    } finally { setBulkLoad(false); }
  };

  // ── Help & Support CRUD ────────────────────────────────────────────────
  const fetchHelp = async () => {
    setHelpLoad(true);
    try { const r = await fetch(HELP_API); setHelpFaqs(await r.json()); }
    catch { setHelpErr('Could not load help FAQs.'); }
    finally { setHelpLoad(false); }
  };

  const handleHelpSubmit = async (e) => {
    e.preventDefault();
    if (!helpForm.title) return setHelpErr('Title is required');
    setSavingHelp(true); setHelpErr('');
    try {
      const token = getToken();
      const url = editingHelp ? `${HELP_API}/${editingHelp}` : HELP_API;
      const method = editingHelp ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(helpForm),
      });
      if (!res.ok) throw new Error();
      setHelpForm({ title:'', description:'', contactEmail:'', contactPhone:'', additionalNotes:'' });
      setEditingHelp(null); fetchHelp();
      showToast(editingHelp ? 'FAQ updated!' : 'FAQ added!');
    } catch { setHelpErr('Save failed.'); }
    finally { setSavingHelp(false); }
  };

  const startEditHelp = (h) => {
    setEditingHelp(h.id);
    setHelpForm({ title: h.title, description: h.description||'', contactEmail: h.contactEmail||'', contactPhone: h.contactPhone||'', additionalNotes: h.additionalNotes||'' });
    setTab('help');
  };

  const deleteHelp = async (id) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await fetch(`${HELP_API}/${id}`, { method: 'DELETE' });
      fetchHelp(); showToast('FAQ deleted.');
    } catch { setHelpErr('Delete failed.'); }
  };

  // ── About Us CRUD ──────────────────────────────────────────────────────
  const fetchAbout = async () => {
    setAboutLoad(true);
    try { const r = await fetch(ABOUT_API); setAboutUs(await r.json()); }
    catch { setAboutErr('Could not load about us.'); }
    finally { setAboutLoad(false); }
  };

  const handleAboutSubmit = async (e) => {
    e.preventDefault();
    if (!aboutForm.title) return setAboutErr('Title is required');
    setSavingAbout(true); setAboutErr('');
    try {
      const token = getToken();
      const url = editingAbout ? `${ABOUT_API}/${editingAbout}` : ABOUT_API;
      const method = editingAbout ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(aboutForm),
      });
      if (!res.ok) throw new Error();
      setAboutForm({ title:'', description:'' });
      setEditingAbout(null); fetchAbout();
      showToast(editingAbout ? 'About updated!' : 'About added!');
    } catch { setAboutErr('Save failed.'); }
    finally { setSavingAbout(false); }
  };

  const startEditAbout = (a) => {
    setEditingAbout(a.id);
    setAboutForm({ title: a.title, description: a.description||'' });
    setTab('about');
  };

  const deleteAbout = async (id) => {
    if (!confirm('Delete this about entry?')) return;
    try {
      await fetch(`${ABOUT_API}/${id}`, { method: 'DELETE' });
      fetchAbout(); showToast('About deleted.');
    } catch { setAboutErr('Delete failed.'); }
  };

  // ── Payment Settings ───────────────────────────────────────────────────
  const fetchPaymentSettings = async () => {
    try {
      const r = await fetch(`${import.meta.env.VITE_PRODUCT_URL || 'http://localhost:8082'}/payment-settings`);
      if (r.ok) { const d = await r.json(); setPayForm({ upiId:d.upiId||'', upiName:d.upiName||'', qrImage:d.qrImage||'', bankName:d.bankName||'', accountHolder:d.accountHolder||'', accountNumber:d.accountNumber||'', ifscCode:d.ifscCode||'', branch:d.branch||'', instructions:d.instructions||'' }); }
    } catch {}
  };

  const savePaymentSettings = async (e) => {
    e.preventDefault(); setPayLoad(true);
    try {
      const token = getToken();
      const r = await fetch(`${import.meta.env.VITE_PRODUCT_URL || 'http://localhost:8082'}/payment-settings`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{}) },
        body: JSON.stringify(payForm),
      });
      if (!r.ok) throw new Error();
      setPaySaved(true); setTimeout(() => setPaySaved(false), 2500);
      showToast('Payment settings saved!');
    } catch { showToast('Save failed.', 'error'); }
    finally { setPayLoad(false); }
  };

  return (
    <>
    <div className={st.page}>
      {showCalc && <ProfitCalculator onClose={() => setShowCalc(false)} />}
      {/* Toast */}
      {toast && (
        <div className={`${st.toast} ${toast.type==='error'?st.toastErr:''}`}>{toast.msg}</div>
      )}

      {/* Shared Admin Navbar + Bottom Nav */}
      <AdminNav activeTab={tab} onTabChange={(id) => { setTab(id); if(id==='bulk') fetchBulkOrders(); if(id==='payment') fetchPaymentSettings(); }} onCalc={() => setShowCalc(true)} />

      <div className={st.content}>

        {/* ── ORDERS ── */}
        {tab==='orders' && (
          <>
            <div className={st.sectionHeader}>
              <h2 className={st.pageTitle}>All Orders</h2>
              <button className={st.refreshBtn} onClick={fetchOrders}>↻ Refresh</button>
            </div>
            {ordErr && <div className={st.errBox}>{ordErr}</div>}
            {ordLoad ? (
              <div className={st.loadingWrap}><div className={st.spinner}/><p>Loading orders…</p></div>
            ) : orders.length===0 ? (
              <div className={st.emptyBox}><p>📭 No orders yet.</p><small>Orders placed by customers will appear here.</small></div>
            ) : (
              <div className={st.orderList}>
                {orders.map((order,idx)=>{
                  const sc2 = sc(order.status);
                  const isDelivered  = order.status === 'DELIVERED';
                  const isCancelled  = order.status === 'CANCELLED';
                  const isTerminal   = isDelivered || isCancelled;

                  // Valid next transitions
                  const FLOW = ['PLACED','ACCEPTED','OUT_FOR_DELIVERY','DELIVERED'];
                  const currentIdx = FLOW.indexOf(order.status);
                  const canCancel  = !isDelivered && !isCancelled;

                  const STATUS_CONFIG = [
                    { key:'PLACED',           icon:'🕐', label:'Placed',      color:'#f57f17', bg:'#fff8e1' },
                    { key:'ACCEPTED',         icon:'✅', label:'Accept',      color:'#1565c0', bg:'#e3f2fd' },
                    { key:'OUT_FOR_DELIVERY', icon:'🚚', label:'Out for Del', color:'#6a1b9a', bg:'#f3e5f5' },
                    { key:'DELIVERED',        icon:'📦', label:'Delivered',   color:'#2e7d32', bg:'#e8f5e9' },
                  ];

                  return (
                    <div key={order.id} className={`${st.orderCard} ${isDelivered?st.orderDelivered:''} ${isCancelled?st.orderCancelled:''}`}>
                      {/* ── Header row ── */}
                      <div className={st.orderTop}>
                        <div className={st.orderTopLeft}>
                          <span className={st.orderId}>Order #{order.id}</span>
                          <span className={st.orderDate}>{order.createdAt?new Date(order.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</span>
                        </div>
                        <div className={st.orderTopRight}>
                          <span className={st.statusBadge} style={{background:sc2.bg,color:sc2.color,border:`1px solid ${sc2.border}`}}>
                            {order.status.replace(/_/g,' ')}
                          </span>
                          <span className={st.orderTotal}>₹{order.totalAmount}</span>
                        </div>
                      </div>

                      {/* ── Meta ── */}
                      <div className={st.orderMeta}>
                        <span>👤 User #{order.userId}</span>
                        <span>💳 {order.paymentId||'—'}</span>
                        <span>📍 {order.deliveryAddress||'Home Delivery'}</span>
                      </div>

                      {/* ── Status actions ── */}
                      {isTerminal ? (
                        <div className={st.terminalRow}>
                          {isDelivered && <span className={st.completedMsg}>✅ Order completed — no further updates allowed</span>}
                          {isCancelled && <span className={st.cancelledMsg}>❌ Order cancelled</span>}
                        </div>
                      ) : (
                        <div className={st.statusRow}>
                          {STATUS_CONFIG.map(cfg => {
                            const isActive  = order.status === cfg.key;
                            const isDone    = FLOW.indexOf(cfg.key) < currentIdx;
                            const isNext    = FLOW.indexOf(cfg.key) === currentIdx + 1;
                            const isUpdating= updatingId === order.id;
                            return (
                              <button key={cfg.key}
                                className={`${st.statusPill} ${isActive?st.statusPillActive:''} ${isDone?st.statusPillDone:''} ${isNext?st.statusPillNext:''}`}
                                style={isActive||isDone ? {background:cfg.bg,color:cfg.color,borderColor:cfg.color} : {}}
                                onClick={() => {
                                  if (!isNext) return;
                                  updateStatus(order.id, cfg.key);
                                }}
                                disabled={!isNext || isUpdating}
                                title={isDone?'Already done':isActive?'Current status':isNext?`Move to ${cfg.label}`:'Not available yet'}>
                                {isUpdating && isNext ? '…' : `${cfg.icon} ${cfg.label}`}
                              </button>
                            );
                          })}
                          {canCancel && (
                            <button className={st.cancelOrderBtn}
                              disabled={updatingId===order.id}
                              onClick={async () => {
                                if (!window.confirm(`Cancel Order #${order.id}? This cannot be undone.`)) return;
                                await updateStatus(order.id,'CANCELLED');
                                showToast('Order cancelled.','error');
                              }}>
                              ✕ Cancel
                            </button>
                          )}
                        </div>
                      )}
                      {/* Invoice button — always visible */}
                      <button
                        className={st.viewInvoiceBtn}
                        onClick={() => setInvoiceOrder({ ...order, orderNum: idx + 1 })}>
                        🧾 View Invoice
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── PRODUCTS ── */}
        {tab==='products' && (
          <>
            <div className={st.sectionHeader}>
              <h2 className={st.pageTitle}>Product Management</h2>
            </div>

            {/* Add form */}
            <div className={st.formCard}>
              <div className={st.formCardHead}>
                <h3 className={st.cardTitle}>Add Product</h3>
                <span className={st.formCardSub}>Fill all required fields to add a product</span>
              </div>
              <form onSubmit={handleAdd} className={st.form}>
                <div className={st.formGrid2}>
                  <div className={st.field}>
                    <label>Product Name</label>
                    <input name="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Mango" required />
                  </div>
                  <div className={st.field}>
                    <label>Price (₹)</label>
                    <input name="price" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="80" required min="1" />
                  </div>
                  <div className={st.field}>
                    <label>Category</label>
                    <select name="category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className={st.select}>
                      <option value="fruit">Fruits</option>
                      <option value="dryfruit">Dry Fruits</option>
                    </select>
                  </div>
                  <div className={st.field}>
                    <label>Unit</label>
                    <input name="unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="kg / piece / dozen" />
                  </div>
                  <div className={st.field}>
                    <label>Discount %</label>
                    <input name="discountPercentage" type="number" value={form.discountPercentage} onChange={e=>setForm({...form,discountPercentage:e.target.value})} placeholder="0" min="0" max="100" />
                  </div>
                  <div className={st.field}>
                    <label>Stock</label>
                    <input name="quantity" type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} placeholder="0" min="0" />
                  </div>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>Image URL</label>
                    <input name="imageUrl" value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})} placeholder="https://..." />
                  </div>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>Description</label>
                    <input name="description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Short description" />
                  </div>
                </div>

                {/* Variants */}
                <div className={st.variantsSection}>
                  <div className={st.variantsHeader}>
                    <span className={st.variantsLabel}>📦 Variants</span>
                    <button type="button" className={st.addVariantBtn}
                      onClick={()=>setVariants(v=>[...v,{...EMPTY_VARIANT}])}>
                      + Add Variant
                    </button>
                  </div>
                  {variants.map((v,i)=>(
                    <div key={i} className={st.variantRow}>
                      <input placeholder="Size (e.g. 1kg)" value={v.size}
                        onChange={e=>{const n=[...variants];n[i]={...n[i],size:e.target.value};setVariants(n);}}
                        className={st.variantInput} />
                      <input placeholder="Price ₹" type="number" value={v.price}
                        onChange={e=>{const n=[...variants];n[i]={...n[i],price:e.target.value};setVariants(n);}}
                        className={st.variantInput} />
                      <input placeholder="Discount %" type="number" value={v.discountPercentage}
                        onChange={e=>{const n=[...variants];n[i]={...n[i],discountPercentage:e.target.value};setVariants(n);}}
                        className={st.variantInput} style={{width:'80px'}} />
                      {variants.length>1 && (
                        <button type="button" className={st.removeVariantBtn}
                          onClick={()=>setVariants(v=>v.filter((_,j)=>j!==i))}>✕</button>
                      )}
                    </div>
                  ))}
                </div>

                {prodErr && <p className={st.error}>{prodErr}</p>}
                <button type="submit" className={st.addProductBtn} disabled={saving}>
                  {saving ? 'Adding…' : '✚ Add Product'}
                </button>
              </form>
            </div>

            {/* Product list */}
            <div className={st.tableCard}>
              <div className={st.tableHeader}>
                <div>
                  <h3 className={st.cardTitle} style={{margin:0}}>All Products</h3>
                  <p className={st.subText}>{products.length} products total</p>
                </div>
                <input className={st.searchInput} placeholder="Search…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
              </div>
              {prodLoad ? <p className={st.loadingText}>Loading…</p>
              : filteredProducts.length===0 ? <p className={st.emptyText}>{searchTerm?`No results for "${searchTerm}"`:'No products yet.'}</p>
              : (
                <div className={st.productCards}>
                  {filteredProducts.map(p=>(
                    <div key={p.id} className={st.productRow}>
                      <img src={getImg(p.imageUrl,p.id)} alt={p.name} className={st.thumb}
                        onError={e=>{e.target.onerror=null;e.target.src=`https://picsum.photos/seed/${p.id}/64`;}} />
                      <div className={st.productInfo}>
                        <span className={st.productName}>{p.name}</span>
                        <div className={st.productMeta}>
                          <span>₹{p.price}</span>
                          <span>•</span>
                          <span>{p.unit||'—'}</span>
                          <span>•</span>
                          <span>{p.discountPercentage||0}% off</span>
                        </div>
                        <span className={`${st.catBadge} ${p.category==='dryfruit'?st.catDry:st.catFruit}`}>
                          {p.category==='dryfruit'?'🥜 Dry Fruit':'🍎 Fruit'}
                        </span>
                      </div>
                      <div className={st.productActions}>
                        <div className={st.stockWrap}>
                          <label className={st.stockLabel}>Stock:</label>
                          <input type="number" value={p.quantity||0} min="0"
                            onChange={e=>updateStock(p.id,parseInt(e.target.value)||0)}
                            className={st.stockInput} />
                        </div>
                        <div className={st.imgUrlWrap}>
                          <input type="text" value={p.imageUrl||''} placeholder="Image URL"
                            onChange={e=>handleImageEdit(p.id,e.target.value)}
                            className={st.imgUrlInput} />
                        </div>
                        <button className={st.deleteBtn} onClick={()=>handleDelete(p.id,p.name)}>🗑 Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── BENEFITS ── */}
        {tab==='benefits' && (
          <>
            <div className={st.sectionHeader}>
              <h2 className={st.pageTitle}>Benefits Management</h2>
            </div>

            <div className={st.formCard}>
              <h3 className={st.cardTitle}>{editingBen?'Edit Benefit':'Add Benefit'}</h3>
              <form onSubmit={handleBenSubmit} className={st.form}>
                <div className={st.formGrid}>
                  <div className={st.field}>
                    <label>Product *</label>
                    <select className={st.select} value={benForm.productId}
                      onChange={e=>{
                        const p=products.find(x=>x.id===parseInt(e.target.value));
                        setBenForm({...benForm,productId:e.target.value,productName:p?.name||''});
                      }} required>
                      <option value="">Select product…</option>
                      {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className={st.field}>
                    <label>Benefit Title *</label>
                    <input value={benForm.title} onChange={e=>setBenForm({...benForm,title:e.target.value})} placeholder="e.g. Rich in Vitamin C" required />
                  </div>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>Description</label>
                    <input value={benForm.description} onChange={e=>setBenForm({...benForm,description:e.target.value})} placeholder="Short description of the benefit" />
                  </div>
                </div>
                {benErr && <p className={st.error}>{benErr}</p>}
                <div style={{display:'flex',gap:'10px'}}>
                  <button type="submit" className={st.addBtn} disabled={savingBen}>{savingBen?'Saving…':editingBen?'Update Benefit':'+ Add Benefit'}</button>
                  {editingBen && <button type="button" className={st.cancelBtn} onClick={()=>{setEditingBen(null);setBenForm({productId:'',productName:'',title:'',description:''});}}>Cancel</button>}
                </div>
              </form>
            </div>

            <div className={st.tableCard}>
              <h3 className={st.cardTitle}>All Benefits</h3>
              {benLoad ? <p className={st.loadingText}>Loading…</p>
              : benefits.length===0 ? <p className={st.emptyText}>No benefits yet. Add some above.</p>
              : (
                <div className={st.benefitList}>
                  {benefits.map(b=>(
                    <div key={b.id} className={st.benefitRow}>
                      <div className={st.benefitIcon}>🌿</div>
                      <div className={st.benefitInfo}>
                        <span className={st.benefitProduct}>{b.productName||`Product #${b.productId}`}</span>
                        <span className={st.benefitTitle}>{b.title}</span>
                        {b.description && <span className={st.benefitDesc}>{b.description}</span>}
                      </div>
                      <div className={st.benefitActions}>
                        <button className={st.editBtn} onClick={()=>startEditBen(b)}>✏️ Edit</button>
                        <button className={st.deleteBtn} onClick={()=>deleteBen(b.id)}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── HELP & SUPPORT ── */}
        {tab==='help' && (
          <>
            <div className={st.sectionHeader}>
              <h2 className={st.pageTitle}>Help & Support</h2>
            </div>

            <div className={st.formCard}>
              <h3 className={st.cardTitle}>{editingHelp?'Edit FAQ':'Add FAQ'}</h3>
              <form onSubmit={handleHelpSubmit} className={st.form}>
                <div className={st.formGrid}>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>FAQ Title *</label>
                    <input value={helpForm.title} onChange={e=>setHelpForm({...helpForm,title:e.target.value})} placeholder="e.g. How to place an order?" required />
                  </div>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>Description</label>
                    <textarea value={helpForm.description} onChange={e=>setHelpForm({...helpForm,description:e.target.value})} placeholder="Detailed answer..." rows="4" className={st.textarea} />
                  </div>
                  <div className={st.field}>
                    <label>Contact Email</label>
                    <input type="email" value={helpForm.contactEmail} onChange={e=>setHelpForm({...helpForm,contactEmail:e.target.value})} placeholder="support@ksrfruits.com" />
                  </div>
                  <div className={st.field}>
                    <label>Contact Phone</label>
                    <input value={helpForm.contactPhone} onChange={e=>setHelpForm({...helpForm,contactPhone:e.target.value})} placeholder="+91 9963983601" />
                  </div>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>Additional Notes</label>
                    <textarea value={helpForm.additionalNotes} onChange={e=>setHelpForm({...helpForm,additionalNotes:e.target.value})} placeholder="Any other information..." rows="3" className={st.textarea} />
                  </div>
                </div>
                {helpErr && <p className={st.error}>{helpErr}</p>}
                <div style={{display:'flex',gap:'10px'}}>
                  <button type="submit" className={st.addBtn} disabled={savingHelp}>{savingHelp?'Saving…':editingHelp?'Update FAQ':'+ Add FAQ'}</button>
                  {editingHelp && <button type="button" className={st.cancelBtn} onClick={()=>{setEditingHelp(null);setHelpForm({title:'',description:'',contactEmail:'',contactPhone:'',additionalNotes:''});}}>Cancel</button>}
                </div>
              </form>
            </div>

            <div className={st.tableCard}>
              <h3 className={st.cardTitle}>All FAQs</h3>
              {helpLoad ? <p className={st.loadingText}>Loading…</p>
              : helpFaqs.length===0 ? <p className={st.emptyText}>No FAQs yet. Add some above.</p>
              : (
                <div className={st.benefitList}>
                  {helpFaqs.map(h=>(
                    <div key={h.id} className={st.benefitRow}>
                      <div className={st.benefitIcon}>❓</div>
                      <div className={st.benefitInfo}>
                        <span className={st.benefitTitle}>{h.title}</span>
                        {h.description && <span className={st.benefitDesc}>{h.description.substring(0,100)}{h.description.length>100?'...':''}</span>}
                        {h.contactEmail && <span className={st.benefitProduct}>📧 {h.contactEmail}</span>}
                        {h.contactPhone && <span className={st.benefitProduct}>📞 {h.contactPhone}</span>}
                      </div>
                      <div className={st.benefitActions}>
                        <button className={st.editBtn} onClick={()=>startEditHelp(h)}>✏️ Edit</button>
                        <button className={st.deleteBtn} onClick={()=>deleteHelp(h.id)}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── BULK ORDERS ── */}
        {tab==='bulk' && (
          <>
            <div className={st.sectionHeader}>
              <h2 className={st.pageTitle}>Bulk Orders</h2>
              <button className={st.refreshBtn} onClick={fetchBulkOrders}>↻ Refresh</button>
            </div>
            {bulkLoad ? <p className={st.loadingText}>Loading…</p>
            : bulkOrders.length===0 ? (
              <div className={st.emptyBox}><p>📭 No bulk orders yet.</p><small>Bulk orders placed by customers will appear here.</small></div>
            ) : (
              <div className={st.orderList}>
                {bulkOrders.map((b,i)=>(
                  <div key={i} className={st.orderCard}>
                    <div className={st.orderTop}>
                      <div>
                        <span className={st.orderId}>Bulk Order #{bulkOrders.length - i}</span>
                        <span className={st.orderDate}>{b.createdAt ? new Date(b.createdAt).toLocaleString('en-IN') : '—'}</span>
                      </div>
                      <span className={st.statusBadge} style={{background:'#e3f2fd',color:'#1565c0',border:'1px solid #90caf9'}}>Pre-Booked</span>
                    </div>
                    <div className={st.orderMeta}>
                      <span>🍎 {b.fruitName || b.fruit}</span>
                      <span>📦 {b.quantity || b.qty} {b.unit}</span>
                      <span>📅 Delivery: {b.deliveryDate || b.date}</span>
                      {b.userId && <span>👤 User #{b.userId}</span>}
                    </div>
                    {(b.notes) && <div style={{fontSize:'.78rem',color:'#666',padding:'6px 0'}}>📝 {b.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ABOUT US ── */}
        {/* ── BANNERS MANAGEMENT ── */}
        {tab==='banners' && (
          <>
            <div className={st.sectionHeader}>
              <h2 className={st.pageTitle}>Banner Management</h2>
              <button className={st.cancelBtn} onClick={resetToDefault}>↺ Reset to Default</button>
            </div>

            <div className={st.formCard}>
              <h3 className={st.cardTitle}>{editingBanner !== null ? 'Edit Banner' : 'Add New Banner'}</h3>
              <form onSubmit={handleBannerSubmit} className={st.form}>
                <div className={st.formGrid}>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>Image — paste a URL or upload a file</label>
                    {/* File upload — compresses to max 800px wide before saving */}
                    <input
                      type="file"
                      accept="image/*"
                      style={{marginBottom:'6px'}}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const img = new Image();
                        const url = URL.createObjectURL(file);
                        img.onload = () => {
                          const MAX = 800;
                          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
                          const w = Math.round(img.width * scale);
                          const h = Math.round(img.height * scale);
                          const canvas = document.createElement('canvas');
                          canvas.width = w; canvas.height = h;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(img, 0, 0, w, h);
                          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                          URL.revokeObjectURL(url);
                          setBannerForm(f => ({...f, imageUrl: dataUrl}));
                          setBannerPreview(dataUrl);
                        };
                        img.src = url;
                      }}
                    />
                    {/* OR paste a URL */}
                    <input
                      value={bannerForm.imageUrl.startsWith('data:') ? '' : bannerForm.imageUrl}
                      onChange={e => { setBannerForm({...bannerForm, imageUrl: e.target.value}); setBannerPreview(e.target.value); }}
                      placeholder="https://images.pexels.com/..."
                    />
                    {bannerPreview && (
                      <img src={bannerPreview} alt="Preview" style={{marginTop:'8px',height:'80px',borderRadius:'8px',objectFit:'cover',width:'100%'}}
                        onError={e => { e.target.style.display='none'; }} />
                    )}
                  </div>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>Title *</label>
                    <input value={bannerForm.title} onChange={e=>setBannerForm({...bannerForm,title:e.target.value})} placeholder="Farm Fresh. Delivered Today." required />
                  </div>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>Subtitle</label>
                    <input value={bannerForm.subtitle} onChange={e=>setBannerForm({...bannerForm,subtitle:e.target.value})} placeholder="Handpicked fruits straight from the farm" />
                  </div>
                  <div className={st.field}>
                    <label>Tag (small label)</label>
                    <input value={bannerForm.tag} onChange={e=>setBannerForm({...bannerForm,tag:e.target.value})} placeholder="Season Special" />
                  </div>
                  <div className={st.field}>
                    <label>Badges (comma-separated)</label>
                    <input value={bannerForm.badges} onChange={e=>setBannerForm({...bannerForm,badges:e.target.value})} placeholder="100% Fresh, Free Delivery, Farm Direct" />
                  </div>
                </div>
                <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
                  <button type="submit" className={st.addBtn}>{editingBanner !== null ? 'Update Banner' : '+ Add Banner'}</button>
                  {editingBanner !== null && (
                    <button type="button" className={st.cancelBtn} onClick={() => { setEditingBanner(null); setBannerForm(EMPTY_BANNER); setBannerPreview(''); }}>Cancel</button>
                  )}
                </div>
              </form>
            </div>

            {/* Banner list */}
            <div className={st.tableCard}>
              <h3 className={st.cardTitle}>All Banners ({banners.length})</h3>
              {banners.length === 0 ? (
                <p className={st.emptyText}>No banners yet. Add one above.</p>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  {banners.map((b, idx) => (
                    <div key={b.id} className={st.productRow} style={{alignItems:'flex-start',gap:'12px'}}>
                      <img
                        src={typeof b.imageUrl === 'string' ? b.imageUrl : ''}
                        alt={b.title}
                        style={{width:'100px',height:'60px',borderRadius:'8px',objectFit:'cover',flexShrink:0,border:'1px solid #e5e7eb'}}
                        onError={e => { e.target.onerror=null; e.target.src=`https://picsum.photos/seed/banner${idx}/100/60`; }}
                      />
                      <div className={st.productInfo} style={{flex:1}}>
                        <span className={st.productName}>{b.title}</span>
                        {b.subtitle && <span style={{fontSize:'.75rem',color:'#6b7280',display:'block'}}>{b.subtitle}</span>}
                        {b.tag && <span style={{fontSize:'.68rem',background:'#f0fdf4',color:'#16a34a',padding:'1px 8px',borderRadius:'10px',display:'inline-block',marginTop:'3px'}}>{b.tag}</span>}
                        {b.badges?.length > 0 && (
                          <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginTop:'4px'}}>
                            {b.badges.map((badge, i) => (
                              <span key={i} style={{fontSize:'.65rem',background:'#f3f4f6',color:'#374151',padding:'1px 6px',borderRadius:'8px'}}>{badge}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:'6px',flexShrink:0}}>
                        <div style={{display:'flex',gap:'4px'}}>
                          {idx > 0 && (
                            <button className={st.editBtn} onClick={() => reorderBanners(idx, idx-1)} title="Move up">↑</button>
                          )}
                          {idx < banners.length - 1 && (
                            <button className={st.editBtn} onClick={() => reorderBanners(idx, idx+1)} title="Move down">↓</button>
                          )}
                        </div>
                        <button className={st.editBtn} onClick={() => startEditBanner(b)}>✏️ Edit</button>
                        <button className={st.deleteBtn} onClick={async () => { if(confirm('Delete this banner?')) { await deleteBanner(b.id); showToast('Banner deleted.'); } }}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ABOUT US ── */}
        {tab==='about' && (          <>
            <div className={st.sectionHeader}>
              <h2 className={st.pageTitle}>About Us</h2>
            </div>

            <div className={st.formCard}>
              <h3 className={st.cardTitle}>{editingAbout?'Edit About':'Add About'}</h3>
              <form onSubmit={handleAboutSubmit} className={st.form}>
                <div className={st.formGrid}>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>Title *</label>
                    <input value={aboutForm.title} onChange={e=>setAboutForm({...aboutForm,title:e.target.value})} placeholder="e.g. About KSR Fruits" required />
                  </div>
                  <div className={`${st.field} ${st.fieldFull}`}>
                    <label>Description</label>
                    <textarea value={aboutForm.description} onChange={e=>setAboutForm({...aboutForm,description:e.target.value})} placeholder="Tell your story..." rows="8" className={st.textarea} />
                  </div>
                </div>
                {aboutErr && <p className={st.error}>{aboutErr}</p>}
                <div style={{display:'flex',gap:'10px'}}>
                  <button type="submit" className={st.addBtn} disabled={savingAbout}>{savingAbout?'Saving…':editingAbout?'Update About':'+ Add About'}</button>
                  {editingAbout && <button type="button" className={st.cancelBtn} onClick={()=>{setEditingAbout(null);setAboutForm({title:'',description:''});}}>Cancel</button>}
                </div>
              </form>
            </div>

            <div className={st.tableCard}>
              <h3 className={st.cardTitle}>All About Entries</h3>
              {aboutLoad ? <p className={st.loadingText}>Loading…</p>
              : aboutUs.length===0 ? <p className={st.emptyText}>No about entries yet. Add one above.</p>
              : (
                <div className={st.benefitList}>
                  {aboutUs.map(a=>(
                    <div key={a.id} className={st.benefitRow}>
                      <div className={st.benefitIcon}>ℹ️</div>
                      <div className={st.benefitInfo}>
                        <span className={st.benefitTitle}>{a.title}</span>
                        {a.description && <span className={st.benefitDesc}>{a.description.substring(0,150)}{a.description.length>150?'...':''}</span>}
                      </div>
                      <div className={st.benefitActions}>
                        <button className={st.editBtn} onClick={()=>startEditAbout(a)}>✏️ Edit</button>
                        <button className={st.deleteBtn} onClick={()=>deleteAbout(a.id)}>🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── PAYMENT SETTINGS ── */}
        {tab==='payment' && (
          <>
            <div className={st.sectionHeader}>
              <h2 className={st.pageTitle}>Payment Settings</h2>
              <span className={st.formCardSub}>Configure UPI, QR code &amp; bank details shown to customers at checkout</span>
            </div>

            {/* Live preview */}
            {payForm.upiId && (
              <div className={st.formCard} style={{ marginBottom:16 }}>
                <h3 className={st.cardTitle} style={{ marginBottom:12 }}>Live Preview — Customer sees this</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {payForm.qrImage && (
                    <div style={{ textAlign:'center' }}>
                      <img src={payForm.qrImage} alt="QR" style={{ width:140, height:140, objectFit:'contain', borderRadius:10, border:'1px solid #e5e7eb' }} />
                      <p style={{ margin:'6px 0 0', fontSize:'0.75rem', color:'#6b7280' }}>Scan with any UPI app</p>
                    </div>
                  )}
                  {/* UPI deep-link buttons */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center' }}>
                    {[
                      { name:'GPay',    color:'#4285F4', scheme:`tez://upi/pay?pa=${payForm.upiId}&pn=${encodeURIComponent(payForm.upiName||'KSR Fruits')}&cu=INR` },
                      { name:'PhonePe', color:'#5f259f', scheme:`phonepe://pay?pa=${payForm.upiId}&pn=${encodeURIComponent(payForm.upiName||'KSR Fruits')}&cu=INR` },
                      { name:'Paytm',   color:'#00BAF2', scheme:`paytmmp://pay?pa=${payForm.upiId}&pn=${encodeURIComponent(payForm.upiName||'KSR Fruits')}&cu=INR` },
                      { name:'BHIM',    color:'#FF6600', scheme:`upi://pay?pa=${payForm.upiId}&pn=${encodeURIComponent(payForm.upiName||'KSR Fruits')}&cu=INR` },
                    ].map(app => (
                      <a key={app.name} href={app.scheme}
                        style={{ padding:'8px 16px', background:app.color, color:'#fff', borderRadius:8, fontWeight:700, fontSize:'0.8rem', textDecoration:'none', display:'inline-block' }}>
                        Pay via {app.name}
                      </a>
                    ))}
                  </div>
                  <p style={{ margin:0, textAlign:'center', fontSize:'0.75rem', color:'#6b7280' }}>
                    UPI ID: <strong>{payForm.upiId}</strong>
                    {payForm.upiName && <> · {payForm.upiName}</>}
                  </p>
                </div>
              </div>
            )}

            <div className={st.formCard}>
              <form onSubmit={savePaymentSettings} className={st.form}>
                <h3 className={st.cardTitle} style={{ marginBottom:12 }}>UPI / GPay / PhonePe / Paytm</h3>
                <p style={{ fontSize:'0.78rem', color:'#6b7280', marginBottom:12 }}>
                  The UPI ID is used to generate deep links that open GPay, PhonePe, Paytm directly on the customer's phone.
                </p>
                <div className={st.formGrid2}>
                  <div className={st.field}>
                    <label>UPI ID <span style={{ color:'#e53935' }}>*</span></label>
                    <input value={payForm.upiId} onChange={e=>setPayForm({...payForm,upiId:e.target.value})} placeholder="yourname@okaxis" />
                  </div>
                  <div className={st.field}>
                    <label>Display Name</label>
                    <input value={payForm.upiName} onChange={e=>setPayForm({...payForm,upiName:e.target.value})} placeholder="KSR Fruits" />
                  </div>
                </div>

                <div className={st.field} style={{ marginTop:12 }}>
                  <label>QR Code Image</label>
                  <p style={{ fontSize:'0.72rem', color:'#6b7280', margin:'2px 0 6px' }}>
                    Upload your UPI QR code. On mobile, tapping it opens the payment app directly.
                  </p>
                  <input type="file" accept="image/*" onChange={e => {
                    const file = e.target.files[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => setPayForm(f => ({...f, qrImage: ev.target.result}));
                    reader.readAsDataURL(file);
                  }} />
                  <input value={payForm.qrImage} onChange={e=>setPayForm({...payForm,qrImage:e.target.value})}
                    placeholder="Or paste image URL / base64" style={{ marginTop:6 }} />
                  {payForm.qrImage && (
                    <img src={payForm.qrImage} alt="QR Preview" style={{ width:100, height:100, objectFit:'contain', marginTop:8, borderRadius:8, border:'1px solid #e5e7eb' }} />
                  )}
                </div>

                <h3 className={st.cardTitle} style={{ marginTop:20, marginBottom:12 }}>Bank Transfer (optional)</h3>
                <div className={st.formGrid2}>
                  <div className={st.field}><label>Bank Name</label><input value={payForm.bankName} onChange={e=>setPayForm({...payForm,bankName:e.target.value})} placeholder="State Bank of India" /></div>
                  <div className={st.field}><label>Account Holder</label><input value={payForm.accountHolder} onChange={e=>setPayForm({...payForm,accountHolder:e.target.value})} placeholder="KSR Fruits" /></div>
                  <div className={st.field}><label>Account Number</label><input value={payForm.accountNumber} onChange={e=>setPayForm({...payForm,accountNumber:e.target.value})} placeholder="XXXXXXXXXXXX" /></div>
                  <div className={st.field}><label>IFSC Code</label><input value={payForm.ifscCode} onChange={e=>setPayForm({...payForm,ifscCode:e.target.value})} placeholder="SBIN0001234" /></div>
                  <div className={st.field}><label>Branch</label><input value={payForm.branch} onChange={e=>setPayForm({...payForm,branch:e.target.value})} placeholder="Main Branch" /></div>
                </div>

                <div className={st.field} style={{ marginTop:12 }}>
                  <label>Payment Instructions</label>
                  <textarea value={payForm.instructions} onChange={e=>setPayForm({...payForm,instructions:e.target.value})} rows={3}
                    placeholder="e.g. After payment, send screenshot to WhatsApp +91XXXXXXXXXX" className={st.textarea} />
                </div>

                <button type="submit" className={st.addProductBtn} disabled={payLoad} style={{ marginTop:16, position:'sticky', bottom:72, width:'100%', padding:'13px', fontSize:'0.95rem' }}>
                  {payLoad ? 'Saving…' : paySaved ? '✓ Saved!' : 'Save Payment Settings'}
                </button>
              </form>
            </div>
          </>
        )}

      </div>
    </div>

      {/* ── Admin Invoice Modal ── */}
      {invoiceOrder && (
        <div className={st.invoiceOverlay} onClick={() => setInvoiceOrder(null)}>
          <div className={st.invoiceModal} onClick={e => e.stopPropagation()}>
            <div className={st.invoiceModalHead}>
              <h3>🧾 Invoice — Order #{invoiceOrder.orderNum}</h3>
              <div className={st.invoiceModalActions}>
                <button className={st.printInvBtn} onClick={printAdminInvoice}>🖨️ Print</button>
                <button className={st.downloadInvBtn} onClick={downloadAdminInvoice}>⬇️ Download</button>
                <button className={st.closeInvBtn} onClick={() => setInvoiceOrder(null)}>✕</button>
              </div>
            </div>
            <div className={st.invoiceBody}>
              {/* Invoice preview */}
              <div className={st.invHead}>
                <h2>🍎 KSR Fruits — Invoice</h2>
                <p>Order #{invoiceOrder.id} &nbsp;·&nbsp; {invoiceOrder.createdAt ? new Date(invoiceOrder.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN')}</p>
              </div>
              <div className={st.invMeta}>
                <p><strong>Customer ID:</strong> User #{invoiceOrder.userId}</p>
                <p><strong>Delivery Address:</strong> {invoiceOrder.deliveryAddress || 'Home Delivery'}</p>
                <p><strong>Payment Method:</strong> {invoiceOrder.paymentId === 'ONLINE' ? 'Online (UPI/GPay)' : 'Cash on Delivery'}</p>
                <p><strong>Order Status:</strong> <span style={{ color: sc(invoiceOrder.status).color, fontWeight: 700 }}>{invoiceOrder.status}</span></p>
              </div>
              <table className={st.invTable}>
                <thead>
                  <tr><th>#</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {invoiceOrder.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{item.productName || `Product #${item.productId}`}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price}</td>
                      <td>₹{(item.quantity * item.price).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={st.invSummary}>
                <div className={st.invRow}><span>Delivery</span><span className={st.invGreen}>FREE</span></div>
                <div className={`${st.invRow} ${st.invTotalRow}`}>
                  <strong>Total Amount</strong><strong>₹{invoiceOrder.totalAmount}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
