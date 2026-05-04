export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

const themeModes = new Set<ThemeMode>(['light', 'dark', 'system']);

export const getThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'system';

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  // Fall back to system mode when the saved value is missing or from an older build.
  return themeModes.has(storedTheme as ThemeMode) ? (storedTheme as ThemeMode) : 'system';
};

export const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const resolveThemeMode = (mode: ThemeMode): ResolvedTheme => {
  // The UI stores "system" as a mode, but Tailwind only needs a resolved light/dark class.
  return mode === 'system' ? getSystemTheme() : mode;
};

export const applyThemeMode = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.toggle('dark', resolveThemeMode(mode) === 'dark');
};

export const setThemeMode = (mode: ThemeMode) => {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyThemeMode(mode);
  window.dispatchEvent(new Event('themechange'));
};

export const getThemeSnapshot = () => {
  const mode = getThemeMode();
  const resolvedTheme = resolveThemeMode(mode);

  // Include both values so system preference changes re-render the selector in system mode.
  return `${mode}:${resolvedTheme}`;
};

export const subscribeTheme = (onStoreChange: () => void) => {
  window.addEventListener('themechange', onStoreChange);
  window.addEventListener('storage', onStoreChange);

  return () => {
    window.removeEventListener('themechange', onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
};
