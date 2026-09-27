import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getInitialLanguage,
  isSupportedLanguage,
  LANGUAGE_STORAGE_KEY,
  resolveBrowserLanguage,
  storeLanguage,
} from './languages';

afterEach(() => {
  localStorage.clear();
});

describe('language preference', () => {
  it('resolves supported and regional browser languages', () => {
    expect(isSupportedLanguage('zh-CN')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);
    expect(resolveBrowserLanguage('ru-RU')).toBe('ru');
    expect(resolveBrowserLanguage('zh-TW')).toBe('zh-CN');
    expect(resolveBrowserLanguage('fr-FR')).toBe('en');
  });

  it('uses a valid stored preference before the browser language', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ru');
    expect(getInitialLanguage()).toBe('ru');
    storeLanguage('zh-CN');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('zh-CN');
  });

  it('falls back to the browser when storage is invalid or unavailable', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('ru-RU');
    expect(getInitialLanguage()).toBe('ru');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(getInitialLanguage()).toBe('ru');
  });
});
