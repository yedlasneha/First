import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const HomeIcon    = (a) => <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>;
const ShopIcon    = (a) => <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>;
const CartIcon    = (a) => <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>;
const HeartIcon   = (a) => <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>;
const ProfileIcon = (a) => <svg className={`w-5 h-5`} fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;

export default function BottomNav() {
  const { pathname } = useLocation();
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();

  const items = [
    { to: '/home',     label: 'Home',    icon: HomeIcon,    badge: 0 },
    { to: '/products', label: 'Shop',    icon: ShopIcon,    badge: 0 },
    { to: '/cart',     label: 'Cart',    icon: CartIcon,    badge: cartCount },
    { to: '/wishlist', label: 'Wishlist',icon: HeartIcon,   badge: wishCount },
    { to: '/profile',  label: 'Me',      icon: ProfileIcon, badge: 0 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{ background: 'var(--bg-card, #ffffff)' }}>
      {/* Solid opaque background — no transparency */}
      <div className="bg-white dark:bg-gray-900 border-t-2 border-gray-100 dark:border-gray-800 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch">
          {items.map(item => {
            const active = pathname === item.to || (item.to !== '/home' && pathname.startsWith(item.to));
            return (
              <Link key={item.to} to={item.to}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-colors ${active ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>
                {item.icon(active)}
                {item.badge > 0 && (
                  <span className="absolute top-1.5 right-[18%] min-w-[15px] h-[15px] bg-green-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                <span className={`text-[10px] font-semibold ${active ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
        {/* Safe area padding for iPhone home bar */}
        <div className="h-safe-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </nav>
  );
}
