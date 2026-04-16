import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((msg, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`
            px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white
            animate-toast-in pointer-events-auto
            ${t.type === 'error'   ? 'bg-red-500'    : ''}
            ${t.type === 'success' ? 'bg-green-600'  : ''}
            ${t.type === 'info'    ? 'bg-blue-500'   : ''}
            ${t.type === 'warn'    ? 'bg-amber-500'  : ''}
          `}>
            {t.type === 'success' && '✓ '}{t.type === 'error' && '✕ '}{t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
