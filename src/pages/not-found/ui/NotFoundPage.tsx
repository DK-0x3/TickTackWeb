import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from './NotFoundPage.module.scss';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>{t('pages.notFound.title')}</h1>
        <Link className={styles.link} to="/inbox">
          {t('pages.notFound.returnToInbox')}
        </Link>
      </section>
    </div>
  );
}
