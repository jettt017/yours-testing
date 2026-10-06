import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const updateFavicon = (targetTheme: Theme) => {
  if (typeof document === 'undefined') return;
  const isDark = targetTheme === 'dark';
  const targetHref = isDark ? '/favicon-white-64.png?v=3' : '/favicon-dark-64.png?v=3';

  // Chromium/Edge requires removing old icon links to repaint the tab favicon
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => {
    link.parentNode?.removeChild(link);
  });

  const link = document.createElement('link');
  link.id = 'app-favicon';
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = targetHref;
  document.head.appendChild(link);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      // 1. Check if user has explicitly chosen a manual preference
      const manual = localStorage.getItem('yours-theme-v2') as Theme | null;
      if (manual === 'light' || manual === 'dark') {
        return manual;
      }
      // 2. Prioritize user OS system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const applyTheme = useCallback((targetTheme: Theme, isManualChoice = false) => {
    setThemeState(targetTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', targetTheme);
      updateFavicon(targetTheme);
      if (isManualChoice) {
        localStorage.setItem('yours-theme-v2', targetTheme);
      }
    }
  }, []);

  // Sync with OS theme changes if user hasn't saved an explicit manual preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Apply active theme attribute and favicon on mount
    document.documentElement.setAttribute('data-theme', theme);
    updateFavicon(theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const manual = localStorage.getItem('yours-theme-v2');
      if (!manual) {
        const newTheme: Theme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme, false);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleSystemChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleSystemChange);
      }
    };
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
  }, [theme, applyTheme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    applyTheme(nextTheme, true);
  }, [applyTheme]);

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

