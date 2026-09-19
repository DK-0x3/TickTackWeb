import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  isSupportedLanguage,
  type Language,
} from '@/shared/config/i18n';

import styles from './LanguageSelect.module.scss';

interface LanguageOption {
  code: string;
  labelKey: string;
  value: Language;
}

const languageOptions = [
  { code: 'EN', labelKey: 'language.english', value: 'en' },
  { code: 'RU', labelKey: 'language.russian', value: 'ru' },
  { code: 'ZH', labelKey: 'language.chineseSimplified', value: 'zh-CN' },
] as const satisfies readonly LanguageOption[];

export function LanguageSelect() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedLanguage = isSupportedLanguage(i18n.language)
    ? i18n.language
    : 'en';
  const selectedOption = languageOptions.find(
    ({ value }) => value === selectedLanguage,
  ) ?? languageOptions[0];
  const availableOptions = languageOptions.filter(
    ({ value }) => value !== selectedLanguage,
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node
        && !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedLanguageName = t(selectedOption.labelKey);

  return (
    <div ref={containerRef} className={styles.languageSelect}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-controls="language-options"
        aria-expanded={isOpen}
        aria-label={t('language.selectorLabel', {
          language: selectedLanguageName,
        })}
        title={selectedLanguageName}
        onClick={() => setIsOpen((open) => !open)}
      >
        {selectedOption.code}
      </button>

      {isOpen
        ? (
            <div
              className={styles.options}
              id="language-options"
              role="group"
              aria-label={t('language.optionsLabel')}
            >
              {availableOptions.map(({ code, labelKey, value }) => {
                const languageName = t(labelKey);

                return (
                  <button
                    key={value}
                    className={styles.option}
                    type="button"
                    aria-label={languageName}
                    title={languageName}
                    onClick={() => {
                      void i18n.changeLanguage(value);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          )
        : null}
    </div>
  );
}
