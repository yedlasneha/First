import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './mobile.css';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Admin pages always light; user pages handled by ThemeProvider
if (window.location.pathname.startsWith('/admin')) {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
