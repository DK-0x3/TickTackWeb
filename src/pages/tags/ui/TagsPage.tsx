import { useTranslation } from 'react-i18next';

import styles from './TagsPage.module.scss';

export function TagsPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>{t('pages.tags.title')}</h1>
      </section>
    </div>
  );
}
