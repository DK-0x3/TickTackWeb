import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ThemeContext } from './themeContext';
import { readStoredTheme, writeStoredTheme } from './themeStorage';
import type { Theme } from './theme.types';
import { useSystemTheme } from './useSystemTheme';

export function ThemeProvider({ children }: PropsWithChildren) {
  const [themePreference, setThemePreference] = useState<Theme | null>(readStoredTheme);
  const systemTheme = useSystemTheme();
  const theme = themePreference ?? systemTheme;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemePreference(nextTheme);
    writeStoredTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
