import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './mobile.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Apply saved USER theme BEFORE first render to avoid flash
// Admin pages manage their own theme separately
const path = window.location.pathname;
const isAdminPage = path.startsWith('/admin');
if (!isAdminPage) {
  const savedTheme = localStorage.getItem('user-theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
} else {
  // Admin always light
  document.documentElement.classList.remove('dark');
}
createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
