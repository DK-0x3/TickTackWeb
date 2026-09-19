import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CalendarIcon,
  CheckIcon,
  ICON_SIZES,
  InboxIcon,
  SettingsIcon,
  TagsIcon,
  type IconComponent,
} from '@/shared/ui/icon';
import styles from './AppSidebar.module.scss';
import { ArrowLeftToLine } from '@/shared/ui/icon/icons/ArrowLeftToLine';
import clsx from 'clsx';
import { ArrowRightToLine } from '@/shared/ui/icon/icons/ArrowRightToLine';

interface Props {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

interface NavigationItem {
  icon: IconComponent;
  labelKey: string;
  to: string;
}

const navigationItems: readonly NavigationItem[] = [
  { icon: InboxIcon, labelKey: 'navigation.inbox', to: '/inbox' },
  { icon: CalendarIcon, labelKey: 'navigation.today', to: '/today' },
  { icon: TagsIcon, labelKey: 'navigation.tags', to: '/tags' },
  { icon: SettingsIcon, labelKey: 'navigation.settings', to: '/settings' },
];

export function AppSidebar({ isCollapsed, onToggleCollapsed }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClickBrand = () => {
    if (isCollapsed) {
      onToggleCollapsed();
      return;
    }
    void navigate('/inbox');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <button className={styles.brand} onClick={handleClickBrand}>
          <div className={clsx(styles.brandContent, isCollapsed && styles.collapsed)}>
            <span className={clsx(styles.brandMark)} aria-hidden="true">
              <CheckIcon size={ICON_SIZES.lg} strokeWidth={2.5} />
            </span>
            <ArrowRightToLine
              className={styles.brandContentHover}
              size={ICON_SIZES.lg}
              strokeWidth={2.5}
            />
          </div>
          <span className={clsx(styles.brandName, isCollapsed && styles.hidden)}>Tick Tack</span>
        </button>
        <button className={clsx(styles.collapseButton, isCollapsed && styles.hidden)} onClick={onToggleCollapsed}>
          <ArrowLeftToLine size={ICON_SIZES.lg} />
        </button>
      </div>

      <nav aria-label={t('navigation.primaryLabel')}>
        <ul className={styles.navigationList}>
          {navigationItems.map(({ icon: NavigationIcon, labelKey, to }) => {
            const label = t(labelKey);

            return (
              <li key={to}>
                <NavLink
                  aria-label={label}
                  className={({ isActive }) => `${styles.navigationLink} ${
                    isActive ? styles.active : ''
                  }`}
                  to={to}
                >
                  <NavigationIcon className={styles.navigationIcon} />
                  <span
                    className={clsx(
                      styles.navigationText,
                      isCollapsed && styles.hidden,
                    )}
                  >
                    {label}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
