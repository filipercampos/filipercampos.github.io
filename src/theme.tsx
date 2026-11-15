import { useEffect, useState } from 'react';
import { useT } from './i18n';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';

function initialTheme(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Light/dark toggle. Until the visitor chooses, the OS preference is followed. */
export function ThemeToggle() {
  const t = useT();
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const follow = (event: MediaQueryListEvent) => {
      if (!document.documentElement.dataset.theme) setTheme(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', follow);
    return () => media.removeEventListener('change', follow);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference just won't persist.
    }
  }

  return (
    <button
      className="btn theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? t.themeToLight : t.themeToDark}
      title={theme === 'dark' ? t.themeToLight : t.themeToDark}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
