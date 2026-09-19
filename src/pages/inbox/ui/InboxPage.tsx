import { useTranslation } from 'react-i18next';

import styles from './InboxPage.module.scss';

export function InboxPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>{t('pages.inbox.title')}</h1>
      </section>
    </div>
  );
}
