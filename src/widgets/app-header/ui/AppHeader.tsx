import { LanguageSelect } from '@/features/change-language';
import { ThemeToggle } from '@/features/theme-toggle';
import { SearchIcon } from '@/shared/ui/icon';
import styles from './AppHeader.module.scss';
import { useEffect, useRef, useState } from 'react';
import { type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

export function AppHeader() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCommandOrControl = e.metaKey || e.ctrlKey;
      if (isCommandOrControl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && !searchText) {
      e.preventDefault();
      searchInputRef.current?.blur();
    }
  };

  return (
    <header className={styles.header}>
      <form
        className={styles.search}
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <SearchIcon className={styles.searchIcon} />
        <input
          ref={searchInputRef}
          className={styles.searchInput}
          type="search"
          placeholder={t('header.searchPlaceholder')}
          aria-label={t('header.searchLabel')}
          autoComplete="off"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          onKeyDown={handleSearchInputKeyDown}
        />
        <kbd className={styles.shortcut} aria-hidden="true">

          ⌘ K
          {' '}
        </kbd>
      </form>

      <div className={styles.actions}>
        <LanguageSelect />
        <ThemeToggle />
      </div>
    </header>
  );
}
