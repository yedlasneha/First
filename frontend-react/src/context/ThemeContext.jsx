import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('user-theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('user-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('user-theme', 'light');
    }
  }, [dark]);

  const toggle = useCallback(() => setDark(v => !v), []);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { dark: false, toggle: () => {} };
  return ctx;
};
