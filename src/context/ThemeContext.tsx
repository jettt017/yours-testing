import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // 1. Check saved preference in localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yours-theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      // 2. Fall back to user OS system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  const applyTheme = useCallback((targetTheme: Theme) => {
    setThemeState(targetTheme);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', targetTheme);
      localStorage.setItem('yours-theme', targetTheme);
    }
  }, []);

  // Sync with OS theme changes if user hasn't saved an explicit override
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Apply active theme attribute to HTML root on mount
    document.documentElement.setAttribute('data-theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const hasSavedPreference = localStorage.getItem('yours-theme');
      if (!hasSavedPreference) {
        const newTheme: Theme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  }, [theme, applyTheme]);

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme: applyTheme,
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
