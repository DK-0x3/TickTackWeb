import { useTranslation } from 'react-i18next';

import styles from './SettingsPage.module.scss';

export function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>{t('pages.settings.title')}</h1>
      </section>
    </div>
  );
}
