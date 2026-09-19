import { useSyncExternalStore } from 'react';

import { getSystemTheme } from './themeStorage';
import type { Theme } from './theme.types';

const DARK_THEME_QUERY = '(prefers-color-scheme: dark)';

function subscribe(onStoreChange: () => void) {
  const mediaQuery = matchMedia(DARK_THEME_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);

  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

export function useSystemTheme(): Theme {
  return useSyncExternalStore(subscribe, getSystemTheme, (): Theme => 'light');
}
