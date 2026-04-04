import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UserAuthProvider } from './context/UserAuthContext';
import { CartProvider } from './context/CartContext';
import { BannerProvider } from './context/BannerContext';
import { ThemeProvider } from './context/ThemeContext';
import { WishlistProvider } from './context/WishlistContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import UserLogin from './pages/UserLogin';
import Home from './pages/Home';
import Orders from './pages/Orders';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <UserAuthProvider>
        <CartProvider>
          <BannerProvider>
            <ThemeProvider>
              <WishlistProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/"        element={<Navigate to="/home" replace />} />
                    <Route path="/login"   element={<UserLogin />} />
                    <Route path="/home"    element={<Home />} />
                    <Route path="/orders"  element={<Orders />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route path="/admin"           element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
                    <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/home" replace />} />
                  </Routes>
                </BrowserRouter>
              </WishlistProvider>
            </ThemeProvider>
          </BannerProvider>
        </CartProvider>
      </UserAuthProvider>
    </AuthProvider>
  );
}
