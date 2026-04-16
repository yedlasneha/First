import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { UserAuthProvider } from './context/UserAuthContext';
import { CartProvider }     from './context/CartContext';
import { BannerProvider }   from './context/BannerContext';
import { ToastProvider }    from './context/ToastContext';
import { AuthProvider }     from './context/AuthContext';
import { ThemeProvider }    from './context/ThemeContext';
import { LocationProvider } from './context/LocationContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar, { LocationBar } from './components/Navbar';
import BottomNav     from './components/BottomNav';
import RequireAuth   from './components/RequireAuth';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LocationModal  from './components/LocationModal';

// User pages — lazy
const Home          = lazy(() => import('./pages/Home'));
const Products      = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart          = lazy(() => import('./pages/Cart'));
const Checkout      = lazy(() => import('./pages/Checkout'));
const OrderSuccess  = lazy(() => import('./pages/OrderSuccess'));
const Orders        = lazy(() => import('./pages/Orders'));
const Profile       = lazy(() => import('./pages/Profile'));
const Wishlist      = lazy(() => import('./pages/Wishlist'));
const UserLogin     = lazy(() => import('./pages/UserLogin'));

// Admin pages — lazy
const AdminLogin     = lazy(() => import('./pages/AdminLogin'));
const Admin          = lazy(() => import('./pages/Admin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-green-600 border-t-transparent rounded-full spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    </div>
  );
}

function UserLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="h-14 sm:h-16" />
      <LocationBar />
      <LocationModal />
      <main className="transition-colors">{children}</main>
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <UserAuthProvider>
            <LocationProvider>
              <BannerProvider>
                <CartProvider>
                  <WishlistProvider>
                    <ToastProvider>
                      <BrowserRouter>
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/" element={<Navigate to="/home" replace />} />
                            <Route path="/login" element={<UserLogin />} />

                            <Route path="/home"     element={<UserLayout><Home /></UserLayout>} />
                            <Route path="/products" element={<UserLayout><Products /></UserLayout>} />
                            <Route path="/product/:id" element={<UserLayout><ProductDetail /></UserLayout>} />
                            <Route path="/wishlist" element={<UserLayout><Wishlist /></UserLayout>} />
                            <Route path="/cart"     element={<UserLayout><Cart /></UserLayout>} />
                            <Route path="/checkout" element={<UserLayout><RequireAuth><Checkout /></RequireAuth></UserLayout>} />
                            <Route path="/order-success" element={<UserLayout><RequireAuth><OrderSuccess /></RequireAuth></UserLayout>} />
                            <Route path="/orders"   element={<UserLayout><RequireAuth><Orders /></RequireAuth></UserLayout>} />
                            <Route path="/profile"  element={<UserLayout><RequireAuth><Profile /></RequireAuth></UserLayout>} />

                            <Route path="/admin-login" element={<AdminLogin />} />
                            <Route path="/admin"       element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
                            <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

                            <Route path="*" element={<Navigate to="/home" replace />} />
                          </Routes>
                        </Suspense>
                      </BrowserRouter>
                    </ToastProvider>
                  </WishlistProvider>
                </CartProvider>
              </BannerProvider>
            </LocationProvider>
          </UserAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
