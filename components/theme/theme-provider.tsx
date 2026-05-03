'use client';

import { useEffect } from 'react';
import { applyThemeMode, getThemeMode } from './theme-store';

export default function ThemeProvider() {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyStoredTheme = () => {
      applyThemeMode(getThemeMode());
    };

    const handleSystemThemeChange = () => {
      if (getThemeMode() !== 'system') return;

      applyStoredTheme();
      window.dispatchEvent(new Event('themechange'));
    };

    applyStoredTheme();
    window.addEventListener('themechange', applyStoredTheme);
    window.addEventListener('storage', applyStoredTheme);
    media.addEventListener('change', handleSystemThemeChange);

    return () => {
      window.removeEventListener('themechange', applyStoredTheme);
      window.removeEventListener('storage', applyStoredTheme);
      media.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return null;
}
