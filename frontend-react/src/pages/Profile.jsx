import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { useTheme } from '../context/ThemeContext';
import { authApi, productApi } from '../api/axios';
import logo from '../assets/icon.png';

// ── SVG icons ─────────────────────────────────────────────────────────────
const IcBack    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IcOrders  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>;
const IcProfile = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcHelp    = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcTerms   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcAbout   = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcLogout  = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcChevron = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IcSun     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const IcMoon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;

// Avatar with colour based on first letter
const GRAD = {A:'#f97316,#ea580c',B:'#8b5cf6,#7c3aed',C:'#06b6d4,#0891b2',D:'#ec4899,#db2777',E:'#10b981,#059669',F:'#f59e0b,#d97706',G:'#6366f1,#4f46e5',H:'#14b8a6,#0d9488',I:'#ef4444,#dc2626',J:'#84cc16,#65a30d',K:'#16a34a,#15803d',L:'#0ea5e9,#0284c7',M:'#a855f7,#9333ea',N:'#f97316,#ea580c',O:'#22c55e,#16a34a',P:'#3b82f6,#2563eb',Q:'#ec4899,#db2777',R:'#ef4444,#dc2626',S:'#f59e0b,#d97706',T:'#06b6d4,#0891b2',U:'#8b5cf6,#7c3aed',V:'#10b981,#059669',W:'#6366f1,#4f46e5',X:'#14b8a6,#0d9488',Y:'#f97316,#ea580c',Z:'#a855f7,#9333ea'};

function Avatar({ name, email, size = 72 }) {
  const letter = (name || email || 'U').trim()[0].toUpperCase();
  const [a, b] = (GRAD[letter] || '#16a34a,#15803d').split(',');
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`linear-gradient(135deg,${a},${b})`,
      color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.38+'px', fontWeight:800, boxShadow:'0 4px 16px rgba(0,0,0,0.2)', flexShrink:0 }}>
      {letter}
    </div>
  );
}

// Expandable accordion row
function Accordion({ IcComp, label, dark, c, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom:`1px solid ${c.border}` }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:'none', border:'none', cursor:'pointer' }}>
        <span style={{ width:32, height:32, borderRadius:8, background:dark?'#1e3a5f':'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', color:dark?'#60a5fa':'#3b82f6', flexShrink:0 }}>
          <IcComp />
        </span>
        <span style={{ flex:1, fontWeight:600, fontSize:'0.88rem', color:c.text, textAlign:'left' }}>{label}</span>
        <span style={{ color:c.sub, display:'flex', transition:'transform 0.2s', transform:open?'rotate(90deg)':'none' }}><IcChevron /></span>
      </button>
      {open && (
        <div style={{ padding:'0 16px 14px 60px', fontSize:'0.82rem', color:c.sub, lineHeight:1.7 }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Simple menu row
function MenuRow({ IcComp, label, sub, onClick, danger, c, noBorder }) {
  return (
    <button onClick={onClick}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
        background:'none', border:'none', cursor:'pointer', borderBottom:noBorder?'none':`1px solid ${c.border}` }}>
      <span style={{ width:32, height:32, borderRadius:8,
        background:danger?(c.dangerBg):(c.iconBg),
        display:'flex', alignItems:'center', justifyContent:'center',
        color:danger?'#ef4444':c.sub, flexShrink:0 }}>
        <IcComp />
      </span>
      <div style={{ flex:1, textAlign:'left' }}>
        <p style={{ margin:0, fontWeight:600, fontSize:'0.88rem', color:danger?'#ef4444':c.text }}>{label}</p>
        {sub && <p style={{ margin:0, fontSize:'0.72rem', color:c.sub }}>{sub}</p>}
      </div>
      {!danger && <span style={{ color:c.sub, display:'flex' }}><IcChevron /></span>}
    </button>
  );
}

export default function Profile() {
  const { user, login, logout } = useUserAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [section, setSection]   = useState('menu'); // 'menu' | 'editProfile'
  const [form, setForm]         = useState({ name:'', email:'', address:'', receiverName:'', receiverMobile:'' });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [helpFaqs, setHelpFaqs] = useState([]);
  const [aboutUs,  setAboutUs]  = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    authApi.get(`/api/auth/profile/${user.userId}`)
      .then(r => { const d = r.data; setForm({ name:d.name||'', email:d.email||'', address:d.address||'', receiverName:d.receiverName||'', receiverMobile:d.receiverMobile||'' }); })
      .catch(() => setForm({ name:user.name||'', email:user.email||'', address:'', receiverName:'', receiverMobile:'' }))
      .finally(() => setLoading(false));
    productApi.get('/api/help').then(r => setHelpFaqs(r.data||[])).catch(()=>{});
    productApi.get('/api/about').then(r => setAboutUs(r.data||[])).catch(()=>{});
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await authApi.put(`/api/auth/profile/${user.userId}`, form);
      login({ ...user, name:form.name, email:form.email, token:localStorage.getItem('user_token') });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save profile'); }
    finally { setSaving(false); }
  };

  // ── Colour tokens ──────────────────────────────────────────────────────
  const c = {
    bg:       dark ? '#0f172a' : '#f1f5f9',
    card:     dark ? '#1e293b' : '#ffffff',
    border:   dark ? '#334155' : '#e2e8f0',
    text:     dark ? '#f1f5f9' : '#0f172a',
    sub:      dark ? '#94a3b8' : '#64748b',
    inputBg:  dark ? '#0f172a' : '#f8fafc',
    inputBdr: dark ? '#334155' : '#e2e8f0',
    iconBg:   dark ? '#1e293b' : '#f8fafc',
    dangerBg: dark ? '#3b1a1a' : '#fef2f2',
  };

  const inputStyle = { width:'100%', padding:'11px 14px', border:`1.5px solid ${c.inputBdr}`, borderRadius:10, fontSize:'0.9rem', outline:'none', boxSizing:'border-box', background:c.inputBg, color:c.text, fontFamily:'inherit' };
  const labelStyle = { fontSize:'0.72rem', fontWeight:700, color:c.sub, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 };
  const cardStyle  = { background:c.card, borderRadius:16, border:`1px solid ${c.border}`, overflow:'hidden', marginBottom:12 };
  const sectionLabel = { margin:'0 0 6px 2px', fontSize:'0.68rem', fontWeight:700, color:c.sub, textTransform:'uppercase', letterSpacing:0.8 };

  return (
    <div style={{ minHeight:'100vh', background:c.bg, fontFamily:"'Inter','Segoe UI',sans-serif", transition:'background 0.2s' }}>

      {/* Header */}
      <header style={{ background:c.card, borderBottom:`1px solid ${c.border}`, position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth:600, margin:'0 auto', padding:'0 16px', height:54, display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => section === 'editProfile' ? setSection('menu') : navigate('/home')}
            style={{ background:'none', border:'none', cursor:'pointer', color:c.sub, display:'flex', alignItems:'center', gap:4, fontWeight:600, fontSize:'0.85rem' }}>
            <IcBack /> {section === 'editProfile' ? 'Back' : 'Home'}
          </button>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:7 }}>
            <img src={logo} alt="KSR" style={{ width:24, height:24, borderRadius:6 }} />
            <span style={{ fontWeight:800, fontSize:'0.9rem', color:c.text }}>
              {section === 'editProfile' ? 'Edit Profile' : 'My Account'}
            </span>
          </div>
          {/* Theme toggle */}
          <button onClick={toggleTheme}
            style={{ width:34, height:34, borderRadius:'50%', border:`1.5px solid ${c.border}`, background:c.iconBg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:dark?'#fbbf24':c.sub, flexShrink:0 }}>
            {dark ? <IcSun /> : <IcMoon />}
          </button>
        </div>
      </header>

      <main style={{ maxWidth:600, margin:'0 auto', paddingBottom:60 }}>

        {/* Hero banner */}
        <div style={{ background:dark?'linear-gradient(135deg,#1a3a2a,#0f2318)':'linear-gradient(135deg,#16a34a,#15803d)', padding:'28px 20px 22px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
          <Avatar name={user?.name} email={user?.email} size={76} />
          <div style={{ textAlign:'center' }}>
            <p style={{ margin:0, fontWeight:800, fontSize:'1.05rem', color:'#fff' }}>{user?.name || 'Welcome'}</p>
            <p style={{ margin:'3px 0 0', fontSize:'0.75rem', color:'rgba(255,255,255,0.65)' }}>{user?.email}</p>
          </div>
          {section === 'menu' && (
            <button onClick={() => setSection('editProfile')}
              style={{ marginTop:4, padding:'6px 20px', background:'rgba(255,255,255,0.15)', color:'#fff', border:'1.5px solid rgba(255,255,255,0.3)', borderRadius:20, fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
              Edit Profile
            </button>
          )}
        </div>

        <div style={{ padding:'16px 14px 0' }}>
          {section === 'menu' ? (
            <>
              {/* Account section */}
              <p style={sectionLabel}>Account</p>
              <div style={cardStyle}>
                <MenuRow IcComp={IcOrders}  label="My Orders"     sub="Track & view your orders"         onClick={() => navigate('/orders')}       c={c} />
                <MenuRow IcComp={IcProfile} label="Edit Profile"  sub="Name, email, delivery address"    onClick={() => setSection('editProfile')} c={c} noBorder />
              </div>

              {/* Preferences section */}
              <p style={{ ...sectionLabel, marginTop:12 }}>Preferences</p>
              <div style={cardStyle}>
                <button onClick={toggleTheme}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'13px 16px', background:'none', border:'none', cursor:'pointer' }}>
                  <span style={{ width:32, height:32, borderRadius:8, background:c.iconBg, display:'flex', alignItems:'center', justifyContent:'center', color:dark?'#fbbf24':c.sub, flexShrink:0 }}>
                    {dark ? <IcSun /> : <IcMoon />}
                  </span>
                  <div style={{ flex:1, textAlign:'left' }}>
                    <p style={{ margin:0, fontWeight:600, fontSize:'0.88rem', color:c.text }}>{dark ? 'Light Mode' : 'Dark Mode'}</p>
                    <p style={{ margin:0, fontSize:'0.72rem', color:c.sub }}>Currently {dark ? 'dark' : 'light'}</p>
                  </div>
                  {/* Toggle pill */}
                  <div style={{ width:44, height:24, borderRadius:12, background:dark?'#16a34a':'#e2e8f0', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:dark?23:3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                </button>
              </div>

              {/* More section */}
              <p style={{ ...sectionLabel, marginTop:12 }}>More</p>
              <div style={cardStyle}>
                <Accordion IcComp={IcHelp}  label="Help & Support"      dark={dark} c={c}>
                  {helpFaqs.length === 0 ? (
                    <p style={{ margin:0 }}>Contact us at <strong>ksrfruitshelp@gmail.com</strong></p>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {helpFaqs.map(faq => (
                        <div key={faq.id}>
                          <p style={{ margin:'0 0 2px', fontWeight:600, color:c.text, fontSize:'0.82rem' }}>{faq.title}</p>
                          {faq.description && <p style={{ margin:0 }}>{faq.description}</p>}
                          {faq.contactEmail && <p style={{ margin:'4px 0 0' }}>📧 {faq.contactEmail}</p>}
                          {faq.contactPhone && <p style={{ margin:'2px 0 0' }}>📞 {faq.contactPhone}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Accordion>
                <Accordion IcComp={IcTerms} label="Terms & Conditions"  dark={dark} c={c}>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    <p style={{ margin:0 }}>By using KSR Fruits, you agree to the following:</p>
                    <p style={{ margin:0 }}>• Orders are subject to product availability and delivery area.</p>
                    <p style={{ margin:0 }}>• Prices may vary based on market rates, especially for bulk orders.</p>
                    <p style={{ margin:0 }}>• Bulk orders require advance payment confirmation before processing.</p>
                    <p style={{ margin:0 }}>• Refunds are processed within 3–5 business days for eligible orders.</p>
                    <p style={{ margin:0 }}>• We reserve the right to cancel orders due to unforeseen circumstances.</p>
                    <p style={{ margin:'6px 0 0', fontSize:'0.72rem', color:c.sub }}>Last updated: 2025</p>
                  </div>
                </Accordion>
                <Accordion IcComp={IcAbout} label="About KSR Fruits"    dark={dark} c={c}>
                  {aboutUs.length === 0 ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <p style={{ margin:0 }}>KSR Fruits is your trusted source for fresh fruits and dry fruits delivered right to your doorstep.</p>
                      <p style={{ margin:'4px 0 0' }}>We source directly from farms to ensure freshness and quality in every order.</p>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {aboutUs.map(a => (
                        <div key={a.id}>
                          {a.title && <p style={{ margin:'0 0 2px', fontWeight:600, color:c.text, fontSize:'0.82rem' }}>{a.title}</p>}
                          {a.description && <p style={{ margin:0 }}>{a.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </Accordion>
              </div>

              {/* Logout */}
              <div style={{ ...cardStyle, marginTop:12 }}>
                <MenuRow IcComp={IcLogout} label="Logout" onClick={() => { logout(); navigate('/login'); }} danger c={c} noBorder />
              </div>

              <p style={{ textAlign:'center', fontSize:'0.68rem', color:c.sub, margin:'20px 0 0' }}>KSR Fruits v1.0 · Made with 🍎</p>
            </>
          ) : (
            /* Edit Profile */
            loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ height:48, background:c.iconBg, borderRadius:10 }} />)}
              </div>
            ) : (
              <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <div style={cardStyle}>
                  <div style={{ padding:'12px 16px', borderBottom:`1px solid ${c.border}` }}>
                    <p style={{ margin:0, ...labelStyle }}>Personal Info</p>
                  </div>
                  <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:12 }}>
                    {[{key:'name',label:'Full Name',placeholder:'Your name',type:'text'},{key:'email',label:'Email',placeholder:'you@email.com',type:'email'}].map(f => (
                      <div key={f.key}>
                        <label style={labelStyle}>{f.label}</label>
                        <input type={f.type} value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})} placeholder={f.placeholder} style={inputStyle} />
                      </div>
                    ))}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ padding:'12px 16px', borderBottom:`1px solid ${c.border}` }}>
                    <p style={{ margin:0, ...labelStyle }}>Delivery Details</p>
                  </div>
                  <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:12 }}>
                    <div>
                      <label style={labelStyle}>Delivery Address</label>
                      <textarea value={form.address} onChange={e => setForm({...form,address:e.target.value})} placeholder="House no, Street, City, State, PIN" rows={3} style={{...inputStyle,resize:'vertical'}} />
                    </div>
                    {[{key:'receiverName',label:'Receiver Name',placeholder:'Name of person receiving delivery'},{key:'receiverMobile',label:'Receiver Mobile',placeholder:'10-digit mobile number'}].map(f => (
                      <div key={f.key}>
                        <label style={labelStyle}>{f.label}</label>
                        <input value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})} placeholder={f.placeholder} style={inputStyle} />
                      </div>
                    ))}
                  </div>
                </div>
                {error && <p style={{ margin:0, color:'#ef4444', fontSize:'0.82rem', background:dark?'#3b1a1a':'#fef2f2', padding:'10px 14px', borderRadius:10 }}>{error}</p>}
                <button type="submit" disabled={saving}
                  style={{ padding:'13px', background:saved?'#15803d':'#16a34a', color:'#fff', border:'none', borderRadius:12, fontSize:'0.92rem', fontWeight:700, cursor:'pointer', opacity:saving?0.7:1, transition:'background 0.2s' }}>
                  {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
                </button>
              </form>
            )
          )}
        </div>
      </main>
    </div>
  );
}
