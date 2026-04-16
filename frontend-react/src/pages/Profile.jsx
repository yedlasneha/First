import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight, Package, Heart, MapPin, Sun, Moon,
  LogOut, HelpCircle, Info, FileText, ArrowLeft,
  Plus, Trash2, CheckCircle, Edit3, User, Mail,
  Home
} from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { authApi, miscApi } from '../api/services';
import { Skeleton } from '../components/Skeleton';

/* ── Address helpers ─────────────────────────────────────────── */
const ADDR_KEY = (uid) => `ksr_addresses_${uid}`;

function loadAddresses(uid) {
  try { return JSON.parse(localStorage.getItem(ADDR_KEY(uid))) || []; } catch { return []; }
}
function saveAddresses(uid, list) {
  localStorage.setItem(ADDR_KEY(uid), JSON.stringify(list));
}

/* ── Reusable sub-components ─────────────────────────────────── */
function BackBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-5 transition-colors font-medium">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-3">
      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 mb-1.5">{title}</p>
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function MenuItem({ Icon, label, to, onClick, danger, right, badge }) {
  const base = `w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors`;
  const color = danger
    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50';
  const inner = (
    <>
      {Icon && <Icon className="w-[18px] h-[18px] shrink-0 text-gray-400 dark:text-gray-500" />}
      <span className="flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>
      )}
      {right !== undefined
        ? right
        : <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />}
    </>
  );
  if (to) return <Link to={to} className={`${base} ${color}`}>{inner}</Link>;
  return <button onClick={onClick} className={`${base} ${color}`}>{inner}</button>;
}

/* ── Address Form ────────────────────────────────────────────── */
const EMPTY_ADDR = { label: 'Home', line1: '', line2: '', city: '', pincode: '', phone: '' };

function AddressForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY_ADDR);
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const inputCls = "w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:bg-gray-700 dark:text-white transition-all";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3">
      {/* Label chips */}
      <div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Address type</p>
        <div className="flex gap-2 flex-wrap">
          {['Home', 'Work', 'Other'].map(l => (
            <button key={l} type="button" onClick={() => setForm(p => ({ ...p, label: l }))}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${form.label === l ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400'}`}>
              {l === 'Home' ? '🏠' : l === 'Work' ? '💼' : '📍'} {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Address Line 1 *</label>
          <input value={form.line1} onChange={f('line1')} placeholder="House / Flat / Building no." className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Address Line 2</label>
          <input value={form.line2} onChange={f('line2')} placeholder="Street, Area, Landmark" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">City *</label>
          <input value={form.city} onChange={f('city')} placeholder="City" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Pincode *</label>
          <input value={form.pincode} onChange={f('pincode')} placeholder="500001" maxLength={6} inputMode="numeric" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">Phone number</label>
          <input value={form.phone} onChange={f('phone')} placeholder="+91 XXXXX XXXXX" type="tel" className={inputCls} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
          Cancel
        </button>
        <button type="button"
          onClick={() => { if (!form.line1.trim() || !form.city.trim() || !form.pincode.trim()) return; onSave(form); }}
          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-all">
          Save Address
        </button>
      </div>
    </div>
  );
}

/* ── Addresses Tab ───────────────────────────────────────────── */
function AddressesTab({ userId, onBack }) {
  const { show } = useToast();
  const [addresses, setAddresses] = useState(() => loadAddresses(userId));
  const [defaultIdx, setDefaultIdx] = useState(() => {
    try { return parseInt(localStorage.getItem(`ksr_default_addr_${userId}`)) || 0; } catch { return 0; }
  });
  const [adding,   setAdding]   = useState(false);
  const [editIdx,  setEditIdx]  = useState(null); // index being edited

  const persist = (list, defIdx) => {
    saveAddresses(userId, list);
    localStorage.setItem(`ksr_default_addr_${userId}`, defIdx);
    setAddresses(list);
    setDefaultIdx(defIdx);
  };

  const handleAdd = (form) => {
    const next = [...addresses, { ...form, id: Date.now() }];
    persist(next, defaultIdx);
    setAdding(false);
    show('Address saved!');
  };

  const handleEdit = (form) => {
    const next = addresses.map((a, i) => i === editIdx ? { ...form, id: a.id } : a);
    persist(next, defaultIdx);
    setEditIdx(null);
    show('Address updated!');
  };

  const handleDelete = (idx) => {
    const next = addresses.filter((_, i) => i !== idx);
    const newDef = defaultIdx >= next.length ? Math.max(0, next.length - 1) : defaultIdx;
    persist(next, newDef);
    show('Address removed');
  };

  const setDefault = (idx) => {
    localStorage.setItem(`ksr_default_addr_${userId}`, idx);
    setDefaultIdx(idx);
    show('Default address updated');
  };

  return (
    <div>
      <BackBtn onClick={onBack} />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-gray-900 dark:text-white">Saved Addresses</h2>
        {!adding && editIdx === null && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all">
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && <div className="mb-4"><AddressForm onSave={handleAdd} onCancel={() => setAdding(false)} /></div>}

      {/* Address cards */}
      {addresses.length === 0 && !adding ? (
        <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <MapPin className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-600 dark:text-gray-400 text-sm mb-1">No saved addresses</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Add an address for faster checkout</p>
          <button onClick={() => setAdding(true)}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all">
            + Add Address
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((addr, idx) => (
            <div key={addr.id || idx}>
              {editIdx === idx ? (
                <AddressForm initial={addr} onSave={handleEdit} onCancel={() => setEditIdx(null)} />
              ) : (
                <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border-2 transition-all shadow-sm ${idx === defaultIdx ? 'border-green-500' : 'border-gray-100 dark:border-gray-700'}`}>
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${idx === defaultIdx ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      <span className="text-base">{addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : '📍'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{addr.label}</span>
                        {idx === defaultIdx && (
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">Default</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {[addr.line1, addr.line2, addr.city, addr.pincode].filter(Boolean).join(', ')}
                      </p>
                      {addr.phone && <p className="text-xs text-gray-400 mt-0.5">{addr.phone}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                    {idx !== defaultIdx && (
                      <button onClick={() => setDefault(idx)}
                        className="flex items-center gap-1 text-xs text-green-600 font-semibold hover:underline">
                        <CheckCircle className="w-3.5 h-3.5" /> Set Default
                      </button>
                    )}
                    <button onClick={() => { setEditIdx(idx); setAdding(false); }}
                      className="flex items-center gap-1 text-xs text-blue-500 font-semibold hover:underline ml-auto">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(idx)}
                      className="flex items-center gap-1 text-xs text-red-500 font-semibold hover:underline">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Profile Page ───────────────────────────────────────── */
export default function Profile() {
  const { user, isLoggedIn, logout, refreshProfile } = useUserAuth();
  const { show }   = useToast();
  const { dark, toggle } = useTheme();
  const { count: wishCount } = useWishlist();
  const navigate   = useNavigate();

  // tab: 'menu' | 'edit' | 'addresses' | 'help' | 'about'
  const [tab,     setTab]     = useState('menu');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ name: '', email: '', address: '', receiverName: '', receiverMobile: '' });
  const [helpData,  setHelpData]  = useState([]);
  const [aboutData, setAboutData] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!user?.userId) return;
    authApi.getProfile(user.userId)
      .then(r => {
        setProfile(r.data);
        setForm({ name: r.data.name || '', email: r.data.email || '', address: r.data.address || '', receiverName: r.data.receiverName || '', receiverMobile: r.data.receiverMobile || '' });
      })
      .catch(() => show('Could not load profile', 'error'))
      .finally(() => setLoading(false));
  }, [user?.userId, isLoggedIn]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.saveProfile(user.userId, form);
      await refreshProfile();
      show('Profile saved!');
      setTab('menu');
    } catch { show('Failed to save profile', 'error'); }
    finally { setSaving(false); }
  };

  const openHelp = async () => {
    setTab('help');
    if (!helpData.length) {
      try { const r = await miscApi.getHelp(); setHelpData(r.data || []); } catch {}
    }
  };

  const openAbout = async () => {
    setTab('about');
    if (!aboutData.length) {
      try { const r = await miscApi.getAbout(); setAboutData(r.data || []); } catch {}
    }
  };

  if (!isLoggedIn) return null;

  const inputCls = "w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 dark:bg-gray-700 dark:text-white transition-all";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 lg:pb-6">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">

        {/* ── Addresses tab ── */}
        {tab === 'addresses' && (
          <AddressesTab userId={user?.userId} onBack={() => setTab('menu')} />
        )}

        {/* ── Help tab ── */}
        {(tab === 'help' || tab === 'about') && (
          <div>
            <BackBtn onClick={() => setTab('menu')} />
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">
              {tab === 'help' ? 'Help & Support' : 'About Us'}
            </h2>
            {(tab === 'help' ? helpData : aboutData).length === 0 ? (
              <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="text-4xl mb-3">{tab === 'help' ? '🤝' : 'ℹ️'}</div>
                <p className="text-sm text-gray-400">No content available yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(tab === 'help' ? helpData : aboutData).map((item, i) => (
                  <div key={item.id || i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1.5 text-sm">{item.title}</h3>
                    {item.description && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>}
                    {item.contactEmail && <p className="text-sm text-green-600 mt-2">📧 {item.contactEmail}</p>}
                    {item.contactPhone && <p className="text-sm text-green-600">📞 {item.contactPhone}</p>}
                    {item.additionalNotes && <p className="text-xs text-gray-400 mt-2 italic">{item.additionalNotes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Edit profile tab ── */}
        {tab === 'edit' && (
          <div>
            <BackBtn onClick={() => setTab('menu')} />
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Edit Profile</h2>
            <form onSubmit={save} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
              {[
                { key: 'name',  label: 'Full Name', placeholder: 'Your name',      type: 'text',  Icon: User },
                { key: 'email', label: 'Email',     placeholder: 'your@email.com', type: 'email', Icon: Mail },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <f.Icon className="w-3.5 h-3.5 text-gray-400" /> {f.label}
                  </label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} className={inputCls} />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-gray-400" /> Default Delivery Address
                </label>
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Your full address…" rows={3} className={`${inputCls} resize-none`} />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 -mt-1">
                💡 Receiver name &amp; phone are asked at checkout time.
              </p>
              <button type="submit" disabled={saving}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full spin" /> Saving…</> : 'Save Profile'}
              </button>
            </form>
          </div>
        )}

        {/* ── Main menu ── */}
        {tab === 'menu' && (
          <>
            {/* Profile header */}
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-4 flex items-center gap-4 border border-gray-100 dark:border-gray-700">
                <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-5 mb-4 flex items-center gap-4 shadow-md">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border-2 border-white/30">
                  <span className="text-white font-black text-2xl">{(form.name || user?.email || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-base truncate">{form.name || 'New User'}</p>
                  <p className="text-green-100 text-sm truncate">{user?.email}</p>
                  {profile?.profileComplete && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-100 font-medium mt-0.5">
                      <CheckCircle className="w-3 h-3" /> Profile complete
                    </span>
                  )}
                </div>
                <button onClick={() => setTab('edit')}
                  className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
                  Edit
                </button>
              </div>
            )}

            {/* Orders */}
            <Section title="Orders">
              <MenuItem Icon={Package} label="My Orders" to="/orders" />
            </Section>

            {/* Shopping */}
            <Section title="Shopping">
              <MenuItem Icon={Heart} label="Wishlist" to="/wishlist" badge={wishCount} />
              <MenuItem Icon={MapPin} label="Saved Addresses" onClick={() => setTab('addresses')} />
            </Section>

            {/* Preferences */}
            <Section title="Preferences">
              <MenuItem
                Icon={dark ? Sun : Moon}
                label={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                onClick={toggle}
                right={
                  <button onClick={e => { e.stopPropagation(); toggle(); }}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${dark ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                }
              />
            </Section>

            {/* Support — only Help & About, no Privacy/Refund */}
            <Section title="Support">
              <MenuItem Icon={HelpCircle} label="Help & Support" onClick={openHelp} />
              <MenuItem Icon={Info}       label="About Us"        onClick={openAbout} />
              <MenuItem Icon={FileText}   label="Terms & Conditions" onClick={openAbout} />
            </Section>

            {/* Account */}
            <Section title="Account">
              <MenuItem Icon={LogOut} label="Logout" danger onClick={() => { logout(); navigate('/login'); }} />
            </Section>

            <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4 pb-2">KSR Fruits v1.0 · Made with ❤️</p>
          </>
        )}
      </div>
    </div>
  );
}
