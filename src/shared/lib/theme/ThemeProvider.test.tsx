import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from './ThemeProvider';
import { THEME_STORAGE_KEY } from './themeStorage';
import { useTheme } from './useTheme';

function ThemeControls() {
  const { theme, toggleTheme } = useTheme();
  return <button type="button" onClick={toggleTheme}>{theme}</button>;
}

function stubSystemTheme(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
}

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.colorScheme = '';
});

describe('ThemeProvider', () => {
  it('starts with the system theme and persists the selected theme', async () => {
    stubSystemTheme(false);
    const user = userEvent.setup();
    render(<ThemeProvider><ThemeControls /></ThemeProvider>);

    expect(screen.getByRole('button', { name: 'light' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'light' }));
    expect(screen.getByRole('button', { name: 'dark' })).toBeTruthy();
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('prefers a valid stored theme over the system theme', () => {
    stubSystemTheme(false);
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    render(<ThemeProvider><ThemeControls /></ThemeProvider>);
    expect(screen.getByRole('button', { name: 'dark' })).toBeTruthy();
  });
});
