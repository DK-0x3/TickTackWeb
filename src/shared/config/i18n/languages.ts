export const SUPPORTED_LANGUAGES = ['en', 'ru', 'zh-CN'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';
export const LANGUAGE_STORAGE_KEY = 'tick-tack-language';

export function isSupportedLanguage(value: string): value is Language {
  return SUPPORTED_LANGUAGES.some((language) => language === value);
}

export function resolveBrowserLanguage(language: string): Language {
  const normalizedLanguage = language.toLowerCase();

  if (normalizedLanguage.startsWith('ru')) {
    return 'ru';
  }

  if (normalizedLanguage.startsWith('zh')) {
    return 'zh-CN';
  }

  return DEFAULT_LANGUAGE;
}

export function getInitialLanguage(): Language {
  try {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (storedLanguage && isSupportedLanguage(storedLanguage)) {
      return storedLanguage;
    }
  } catch {
    return resolveBrowserLanguage(navigator.language);
  }

  return resolveBrowserLanguage(navigator.language);
}

export function storeLanguage(language: Language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    return;
  }
}
