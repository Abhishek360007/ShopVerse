import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';
export const THEMES = ['dark', 'light'];

/** Saved choice, otherwise the device's light/dark setting. */
export const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (THEMES.includes(saved)) return saved;
  } catch (e) {
    // storage unavailable
  }
  const prefersLight = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches;
  return prefersLight ? 'light' : 'dark';
};

export const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    // storage unavailable: the theme still applies for this visit
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
};

export const currentTheme = () =>
  (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light') ? 'light' : 'dark';

/** Current theme plus a toggle; stays in sync across components. */
export const useTheme = () => {
  const [theme, setTheme] = useState(currentTheme);

  useEffect(() => {
    const onChange = (e) => setTheme(e.detail);
    window.addEventListener('themechange', onChange);
    return () => window.removeEventListener('themechange', onChange);
  }, []);

  const toggle = useCallback(() => applyTheme(currentTheme() === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle };
};
