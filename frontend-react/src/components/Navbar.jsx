import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Mic, ShoppingCart, Heart, User, Menu, X,
  Home, ShoppingBag, Package, MapPin, ChevronDown,
  Sun, Moon, LogOut, ChevronRight
} from 'lucide-react';
import { useUserAuth } from '../context/UserAuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useLocation2 } from '../context/LocationContext';
import { useWishlist } from '../context/WishlistContext';
import { productApi } from '../api/services';

/* ── Location bar (rendered BELOW navbar) ─────────────────────── */
export function LocationBar() {
  const { location, loading, denied, isInFastZone, setShowModal } = useLocation2();

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-3 sm:px-4 lg:px-6 py-1.5">
      <div className="flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Delivering to:</span>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors min-w-0">
          {loading ? (
            <>
              <span className="w-2.5 h-2.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="text-gray-400 font-normal">Detecting…</span>
            </>
          ) : denied ? (
            <span className="text-orange-500">⚠ Location denied — tap to set</span>
          ) : location ? (
            <>
              {!location.manual && (
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
              <span className="truncate max-w-[140px] sm:max-w-xs">{location.label}</span>
              {location.distKm != null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                  isInFastZone ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
                }`}>
                  {isInFastZone ? '⚡ Fast' : `${location.distKm}km`}
                </span>
              )}
            </>
          ) : (
            <span className="text-green-600">📍 Set location</span>
          )}
          <ChevronDown className="w-3 h-3 shrink-0 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// ── Levenshtein distance for fuzzy matching ──────────────────────────────
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// Find closest product name to a misspelled query
function findClosestMatch(query, products) {
  if (!products.length) return null;
  const q = query.toLowerCase();
  let best = null, bestDist = Infinity;
  for (const p of products) {
    const name = p.name.toLowerCase();
    // Check first word (e.g. "Apple" from "Apple Red")
    const firstWord = name.split(' ')[0];
    const dist = Math.min(levenshtein(q, name), levenshtein(q, firstWord));
    if (dist < bestDist) { bestDist = dist; best = p; }
  }
  // Only suggest if distance is small relative to query length
  const threshold = Math.max(2, Math.floor(query.length * 0.4));
  return bestDist <= threshold ? best : null;
}

// Greetings / non-product phrases
const GREETINGS = ['hello', 'hi', 'hey', 'helo', 'hii', 'namaste', 'good morning', 'good evening', 'good afternoon', 'howdy', 'sup', 'what\'s up'];
function isGreeting(text) {
  const t = text.toLowerCase().trim();
  return GREETINGS.some(g => t === g || t.startsWith(g + ' ') || t.endsWith(' ' + g));
}

/* ── Search dropdown ──────────────────────────────────────────── */
function SearchDropdown({ list, searchQ, suggestion, greeting, onSelect, onSeeAll, onSuggestion }) {
  if (greeting) return (
    <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[60] px-4 py-4 text-center">
      <p className="text-2xl mb-1">👋</p>
      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Hey there! Welcome to KSR Fruits 🍎</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Search for mangoes, apples, dry fruits and more!</p>
    </div>
  );

  if (!list.length && !suggestion) return null;

  return (
    <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[60]">
      {/* Fuzzy suggestion — shown when no exact results */}
      {list.length === 0 && suggestion && (
        <button onClick={() => onSuggestion(suggestion.name.split(' ')[0])}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-left border-b border-gray-100 dark:border-gray-700 transition-colors">
          <span className="text-lg">🔍</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Did you mean</p>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">"{suggestion.name.split(' ')[0]}"?</p>
          </div>
          <img src={suggestion.imageUrl || `https://picsum.photos/seed/${suggestion.id}/40/40`} alt={suggestion.name}
            className="w-9 h-9 rounded-xl object-cover shrink-0"
            onError={e => { e.target.src = `https://picsum.photos/seed/${suggestion.id}/40/40`; }} />
        </button>
      )}

      {list.map(p => {
        const dp = p.discountPercentage > 0 ? p.price * (1 - p.discountPercentage / 100) : p.price;
        return (
          <button key={p.id} onClick={() => onSelect(p.id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
            <img src={p.imageUrl || `https://picsum.photos/seed/${p.id}/40/40`} alt={p.name}
              className="w-9 h-9 rounded-xl object-cover shrink-0 bg-gray-100"
              onError={e => { e.target.src = `https://picsum.photos/seed/${p.id}/40/40`; }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{p.name}</p>
              <p className="text-xs text-gray-400 capitalize">{p.category} · {p.unit}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-green-600">₹{dp.toFixed(0)}</p>
              {p.discountPercentage > 0 && <p className="text-[10px] text-gray-400 line-through">₹{p.price}</p>}
            </div>
          </button>
        );
      })}

      {list.length > 0 && (
        <button onClick={onSeeAll}
          className="w-full px-4 py-2.5 text-xs text-green-600 font-semibold hover:bg-green-50 dark:hover:bg-gray-700 text-center border-t border-gray-100 dark:border-gray-700 transition-colors">
          See all results for "{searchQ}" →
        </button>
      )}
    </div>
  );
}

/* ── Main Navbar ──────────────────────────────────────────────── */
export default function Navbar() {
  const { user, isLoggedIn, logout } = useUserAuth();
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { dark, toggle }     = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [searchQ,   setSearchQ]   = useState('');
  const [results,   setResults]   = useState([]);
  const [suggestion,setSuggestion]= useState(null);  // fuzzy match suggestion
  const [greeting,  setGreeting]  = useState(false); // greeting detected
  const [searching, setSearching] = useState(false);
  const [showDrop,  setShowDrop]  = useState(false);
  const [micActive, setMicActive] = useState(false);

  const searchRef   = useRef(null);
  const debounceRef = useRef(null);
  const micRef      = useRef(null);
  const allProdRef  = useRef([]);  // cached product list for fuzzy matching

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Close search dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Clean query — strip punctuation, trim whitespace
  const cleanQuery = (val) => val.replace(/[^\w\s]/g, '').trim();

  const doSearch = (val) => {
    setSearchQ(val);
    clearTimeout(debounceRef.current);
    setSuggestion(null);
    setGreeting(false);

    const clean = cleanQuery(val);
    if (!clean) { setResults([]); setShowDrop(false); return; }

    // Greeting detection — show friendly message, don't search
    if (isGreeting(clean)) {
      setResults([]); setSuggestion(null); setGreeting(true); setShowDrop(true);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        // Ensure we have all products cached for fuzzy matching
        if (!allProdRef.current.length) {
          const all = await productApi.getAll();
          allProdRef.current = (Array.isArray(all.data) ? all.data : []).filter(p => p.active !== false);
        }
        const allProds = allProdRef.current;

        // 1. Backend search with cleaned query
        const r = await productApi.search(clean);
        let list = (Array.isArray(r.data) ? r.data : []).filter(p => p.active !== false).slice(0, 8);

        // 2. Client-side partial match fallback
        if (list.length === 0) {
          const q = clean.toLowerCase();
          list = allProds.filter(p =>
            p.name.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q)
          ).slice(0, 8);
        }

        // 3. Fuzzy suggestion when still no results
        let fuzzy = null;
        if (list.length === 0) {
          fuzzy = findClosestMatch(clean, allProds);
        }

        setResults(list);
        setSuggestion(fuzzy);
        setShowDrop(true);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  };

  const goProduct = (id) => {
    navigate(`/product/${id}`);
    setSearchQ(''); setResults([]); setSuggestion(null); setGreeting(false); setShowDrop(false);
  };

  const goSearch = (q) => {
    const query = cleanQuery(q || searchQ);
    if (!query) return;
    navigate(`/products?q=${encodeURIComponent(query)}`);
    setShowDrop(false);
    setSearchQ('');
    setResults([]);
  };

  const goSuggestion = (name) => {
    const clean = cleanQuery(name);
    navigate(`/products?q=${encodeURIComponent(clean)}`);
    setShowDrop(false);
    setSearchQ('');
    setResults([]);
    setSuggestion(null);
  };

  const handleMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      // Browser doesn't support — show a toast-like alert
      alert('Voice search is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    // If already recording, stop it
    if (micActive && micRef.current) {
      micRef.current.stop();
      setMicActive(false);
      return;
    }

    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => setMicActive(true);

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      setMicActive(false);

      // Greeting detection via mic
      if (isGreeting(transcript)) {
        setSearchQ(transcript);
        setGreeting(true);
        setResults([]);
        setSuggestion(null);
        setShowDrop(true);
        return;
      }

      // Normal product search — set query AND navigate to products page
      const cleanT = cleanQuery(transcript);
      doSearch(cleanT);
      setTimeout(() => {
        navigate(`/products?q=${encodeURIComponent(cleanT)}`);
        setShowDrop(false);
        setSearchQ('');
        setResults([]);
      }, 400);
    };

    rec.onerror = (e) => {
      setMicActive(false);
      if (e.error === 'not-allowed') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings.');
      }
      // other errors (no-speech, network) — silently ignore
    };

    rec.onend = () => setMicActive(false);

    micRef.current = rec;
    try { rec.start(); } catch { setMicActive(false); }
  };

  const navLinks = [
    { to: '/home',     label: 'Home',      Icon: Home },
    { to: '/products', label: 'Shop',      Icon: ShoppingBag },
    { to: '/orders',   label: 'My Orders', Icon: Package },
    { to: '/wishlist', label: 'Wishlist',  Icon: Heart },
    { to: '/profile',  label: 'Profile',   Icon: User },
  ];

  return (
    <>
      {/* ── Mic recording overlay ── */}
      {micActive && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { micRef.current?.stop(); setMicActive(false); }}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl mx-4 max-w-xs w-full"
            onClick={e => e.stopPropagation()}>
            {/* KSR Logo */}
            <img src="/logo.png" alt="KSR Fruits" className="w-20 h-20 object-contain rounded-2xl shadow-md" />
            {/* Pulsing mic indicator */}
            <div className="relative flex items-center justify-center">
              <span className="absolute w-16 h-16 rounded-full bg-red-400 opacity-30 animate-ping" />
              <span className="absolute w-12 h-12 rounded-full bg-red-400 opacity-40 animate-ping" style={{ animationDelay: '0.2s' }} />
              <div className="relative w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <Mic className="w-7 h-7 text-white" />
              </div>
            </div>
            <p className="text-base font-bold text-gray-800 dark:text-white">Listening…</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Speak the fruit name you're looking for</p>
            <button onClick={() => { micRef.current?.stop(); setMicActive(false); }}
              className="mt-1 px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Fixed Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-green-100 dark:border-gray-800 shadow-[0_2px_12px_rgba(14,168,85,0.08)] transition-colors">
        <div className="w-full px-0 sm:px-2 lg:px-4 h-14 sm:h-16 flex items-center gap-1 sm:gap-2">

          {/* Logo */}
          <Link to="/home" className="shrink-0">
            <img src="/logo.png" alt="KSR Fruits" className="h-10 sm:h-12 w-auto object-contain rounded-xl" style={{ maxWidth: 110 }} />
          </Link>

          {/* Home button — desktop only, hidden on mobile */}
          <Link to="/home"
            className={`hidden sm:flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
              location.pathname === '/home'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}>
            <Home className="w-4 h-4" />
            <span className="hidden lg:inline">Home</span>
          </Link>

          {/* Search bar — center, always visible on md+ */}
          <div ref={searchRef} className="relative flex-1 max-w-xl mx-2 sm:mx-3">
            <div className="flex items-center bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full px-3 py-2 gap-2 focus-within:border-green-500 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(14,168,85,0.12)] dark:focus-within:bg-gray-700 transition-all shadow-sm">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400 dark:text-white min-w-0"
                placeholder="Search fruits, dry fruits…"
                value={searchQ}
                onChange={e => doSearch(e.target.value)}
                onFocus={() => { if (results.length) setShowDrop(true); }}
                onKeyDown={e => e.key === 'Enter' && goSearch()}
              />
              {searching
                ? <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin shrink-0" />
                : searchQ
                  ? <button onClick={() => { setSearchQ(''); setResults([]); setSuggestion(null); setGreeting(false); setShowDrop(false); }}
                      className="text-gray-400 hover:text-gray-600 shrink-0 text-sm leading-none">✕</button>
                  : <button onClick={handleMic} title={micActive ? 'Stop recording' : 'Voice search'}
                      className={`transition-colors shrink-0 relative ${micActive ? 'text-red-500' : 'text-gray-400 hover:text-green-600'}`}>
                      <Mic className={`w-4 h-4 ${micActive ? 'animate-pulse' : ''}`} />
                    </button>}
            </div>
            {showDrop && (
              <SearchDropdown
                list={results}
                searchQ={searchQ}
                suggestion={suggestion}
                greeting={greeting}
                onSelect={goProduct}
                onSeeAll={() => goSearch()}
                onSuggestion={goSuggestion}
              />
            )}
          </div>

          {/* Right icons — Wishlist + Cart + Menu only */}
          <div className="flex items-center gap-0.5 shrink-0">

            {/* Dark/Light toggle — mobile only (sm: hidden, replaced by wishlist) */}
            <button onClick={toggle} title={dark ? 'Light mode' : 'Dark mode'}
              className="sm:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {dark
                ? <Sun className="w-5 h-5 text-yellow-400" />
                : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
            </button>

            {/* Wishlist — desktop only */}
            <Link to="/wishlist"
              className={`hidden sm:flex relative items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                location.pathname === '/wishlist'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              <Heart className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline text-sm">Wishlist</span>
              {wishCount > 0 && (
                <span className="min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {wishCount > 9 ? '9+' : wishCount}
                </span>
              )}
            </Link>

            {/* Cart — desktop only */}
            <Link to="/cart"
              className={`hidden sm:flex relative items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                location.pathname === '/cart'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              <ShoppingCart className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="min-w-[16px] h-4 bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Hamburger — desktop only */}
            <button onClick={() => setMenuOpen(o => !o)}
              className="hidden sm:block p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {menuOpen
                ? <X className="w-5 h-5 text-gray-800 dark:text-white" />
                : <Menu className="w-5 h-5 text-gray-800 dark:text-white" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Slide-in Menu Drawer ── */}
      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div className={`fixed top-0 right-0 h-full z-[60] bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col
        w-[min(320px,85vw)] sm:w-80
        ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <img src="/logo.png" alt="KSR Fruits" className="h-9 w-auto object-contain" />
          <button onClick={() => setMenuOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>
        </div>

        {/* User card */}
        {isLoggedIn ? (
          <div className="mx-4 mt-4 mb-2 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-4 flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border-2 border-white/30">
              <span className="text-white font-black text-lg">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-sm truncate">{user?.name || 'User'}</p>
              <p className="text-green-100 text-xs truncate">{user?.email}</p>
            </div>
            <Link to="/profile" onClick={() => setMenuOpen(false)}
              className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors">
              Edit
            </Link>
          </div>
        ) : (
          <div className="mx-4 mt-4 mb-2 shrink-0">
            <Link to="/login" onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-colors">
              <User className="w-4 h-4" /> Login / Sign Up
            </Link>
          </div>
        )}

        {/* Nav links — scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {navLinks.map(({ to, label, Icon: I }) => {
            const active = location.pathname === to || (to !== '/home' && location.pathname.startsWith(to));
            return (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl mb-1 transition-all ${
                  active
                    ? 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                    : 'text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  active
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200'
                }`}>
                  <I className="w-[18px] h-[18px]" />
                </div>
                <span className="font-semibold text-sm flex-1">{label}</span>
                <ChevronRight className={`w-4 h-4 shrink-0 ${active ? 'text-green-500' : 'text-gray-300 dark:text-gray-500'}`} />
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-2 border-t border-gray-100 dark:border-gray-700" />

          {/* Dark mode toggle */}
          <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={toggle}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gray-100 dark:bg-gray-700">
              {dark
                ? <Sun className="w-[18px] h-[18px] text-yellow-400" />
                : <Moon className="w-[18px] h-[18px] text-gray-600 dark:text-gray-200" />}
            </div>
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100 flex-1">
              {dark ? 'Light Mode' : 'Dark Mode'}
            </span>
            <button onClick={e => { e.stopPropagation(); toggle(); }}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${dark ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${dark ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Logout */}
          {isLoggedIn && (
            <>
              <div className="my-2 border-t border-gray-100 dark:border-gray-700" />
              <button onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-900/30">
                  <LogOut className="w-[18px] h-[18px] text-red-500" />
                </div>
                <span className="font-semibold text-sm flex-1">Logout</span>
              </button>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">KSR Fruits · Fresh & Fast 🍎</p>
        </div>
      </div>
    </>
  );
}
