import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import s from './AdminNav.module.css';

const CALC_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/>
  </svg>
);

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: 'orders',    label: 'Orders',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> },
  { id: 'products',  label: 'Products',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
  { id: 'benefits',  label: 'Benefits',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: 'banners',   label: 'Banners',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { id: 'help',      label: 'Help',      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { id: 'payment',   label: 'Payment',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
];

export default function AdminNav({ activeTab, onTabChange, onCalc }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const isDash     = location.pathname === '/admin/dashboard';

  const handleTab = (id) => {
    if (id === 'dashboard') { navigate('/admin/dashboard'); return; }
    if (isDash) navigate('/admin');
    onTabChange?.(id);
  };

  const isActive = (id) => id === 'dashboard' ? isDash : (!isDash && activeTab === id);

  return (
    <>
      {/* ── Top Navbar ── */}
      <nav className={s.nav}>
        {/* Logo */}
        <button className={s.brand} onClick={() => navigate('/admin/dashboard')}>
          <div className={s.logoMark}>
            <span className={s.logoK}>K</span>
            <span className={s.logoS}>S</span>
            <span className={s.logoR}>R</span>
          </div>
          <div className={s.brandText}>
            <span className={s.brandName}>KSR Fruits</span>
            <span className={s.brandSub}>Admin</span>
          </div>
        </button>

        {/* Desktop tab links */}
        <div className={s.tabs}>
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              className={`${s.tab} ${isActive(item.id) ? s.tabActive : ''}`}
              onClick={() => handleTab(item.id)}>
              {item.label}
            </button>
          ))}
          <button className={`${s.tab} ${!isDash && activeTab === 'bulk' ? s.tabActive : ''}`} onClick={() => handleTab('bulk')}>Bulk</button>
          <button className={`${s.tab} ${!isDash && activeTab === 'about' ? s.tabActive : ''}`} onClick={() => handleTab('about')}>About</button>
        </div>

        {/* Right: Calc + Logout */}
        <div className={s.navRight}>
          <button className={s.calcBtn} onClick={onCalc} title="Profit Calculator">
            {CALC_ICON}
            <span>Calc</span>
          </button>
          <button className={s.logoutBtn} onClick={() => { logout(); navigate('/admin-login'); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* ── Mobile Bottom Nav ── */}
      <nav className={s.bottomNav}>
        {NAV_ITEMS.map(item => (
          <button key={item.id}
            className={`${s.bnBtn} ${isActive(item.id) ? s.bnActive : ''}`}
            onClick={() => handleTab(item.id)}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
        <button className={s.bnBtn} onClick={onCalc}>
          {CALC_ICON}
          <span>Calc</span>
        </button>
      </nav>
    </>
  );
}
