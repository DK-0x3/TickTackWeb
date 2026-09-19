import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/lib/theme';
import { MoonIcon, SunIcon } from '@/shared/ui/icon';

import styles from './ThemeToggle.module.scss';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === 'light' ? MoonIcon : SunIcon;
  const accessibleLabel = t(
    theme === 'light' ? 'theme.useDark' : 'theme.useLight',
  );

  return (
    <button
      className={styles.button}
      type="button"
      aria-label={accessibleLabel}
      title={accessibleLabel}
      onClick={toggleTheme}
    >
      <ThemeIcon className={styles.icon} />
    </button>
  );
}
