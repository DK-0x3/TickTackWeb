import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ru from './locales/ru.json';
import zhCN from './locales/zh-CN.json';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  getInitialLanguage,
  isSupportedLanguage,
  resolveBrowserLanguage,
  storeLanguage,
} from './languages';

const resources = {
  'en': { translation: en },
  'ru': { translation: ru },
  'zh-CN': { translation: zhCN },
} as const;

const initialLanguage = getInitialLanguage();

document.documentElement.lang = initialLanguage;

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  load: 'currentOnly',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (language) => {
  const resolvedLanguage = isSupportedLanguage(language)
    ? language
    : resolveBrowserLanguage(language);

  document.documentElement.lang = resolvedLanguage;
  storeLanguage(resolvedLanguage);
});

export { i18n };
