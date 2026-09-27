import { useTranslation } from 'react-i18next';

import { InboxIcon } from '@/shared/ui/icon';
import { TaskListWidget } from '@/widgets/task-list';

import { useInboxTasks } from '../model/useInboxTasks';
import styles from './InboxPage.module.scss';

export function InboxPage() {
  const { t } = useTranslation();
  const inboxTasks = useInboxTasks();
  const showCounts = inboxTasks.status === 'success';
  const remainingCount = Math.max(inboxTasks.totalCount - inboxTasks.completedCount, 0);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('pages.inbox.title')}</h1>
      </header>

      <div className={styles.columns}>
        <div className={styles.lists}>
          <TaskListWidget
            {...inboxTasks}
            headerIcon={<InboxIcon />}
            title={t('pages.inbox.tasks')}
          />
        </div>

        <aside className={styles.widgets} aria-labelledby="inbox-overview-title">
          <section className={styles.overview}>
            <h2 className={styles.overviewTitle} id="inbox-overview-title">
              {t('pages.inbox.overview.title')}
            </h2>
            <dl className={styles.counts}>
              <div className={styles.count}>
                <dt>{t('pages.inbox.overview.total')}</dt>
                <dd>{showCounts ? inboxTasks.totalCount : '—'}</dd>
              </div>
              <div className={styles.count}>
                <dt>{t('pages.inbox.overview.completed')}</dt>
                <dd>{showCounts ? inboxTasks.completedCount : '—'}</dd>
              </div>
              <div className={styles.count}>
                <dt>{t('pages.inbox.overview.remaining')}</dt>
                <dd>{showCounts ? remainingCount : '—'}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
