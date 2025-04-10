import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const useSystemTheme = () => {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDark ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (window.matchMedia) {
      const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => {
        if (localStorage.getItem('theme') === 'system') {
          setTheme(e.matches ? 'dark' : 'light');
        }
      };
      colorSchemeQuery.addEventListener('change', listener);
      return () => {
        colorSchemeQuery.removeEventListener('change', listener);
      };
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, useSystemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
