import { useTranslation } from 'react-i18next';

import styles from './TodayPage.module.scss';

export function TodayPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>{t('pages.today.title')}</h1>
      </section>
    </div>
  );
}
