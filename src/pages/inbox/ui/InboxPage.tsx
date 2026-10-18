import { useTranslation } from 'react-i18next';
import { type TaskViewSection, useGetInboxViewsQuery } from '@/entities/task-view';

import styles from './InboxPage.module.scss';
import { TaskListView } from '@/widgets/task-list';
import { useApiErrorMessage } from '@/shared/api';
import { AlertCircleIcon, RefreshIcon } from '@/shared/ui/icon';

const HIDDEN_PROGRESS_BAR_SECTIONS: TaskViewSection[] = ['completed', 'overdue'];

export function InboxPage() {
  const { t } = useTranslation();
  const { data, error, isFetching, refetch } = useGetInboxViewsQuery();
  const getApiErrorMessage = useApiErrorMessage();

  const errorMessage = error ? getApiErrorMessage(error) : null;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('pages.inbox.title')}</h1>
      </header>

      <div className={styles.columns}>
        <div className={styles.lists}>
          {errorMessage && (
            <div className={styles.loadError} role="alert" aria-busy={isFetching}>
              <span className={styles.errorIcon}><AlertCircleIcon size={24} /></span>
              <div className={styles.errorContent}>
                <h2 className={styles.errorTitle}>{t('tasks.list.errorTitle')}</h2>
                <p className={styles.errorDescription}>{errorMessage}</p>
              </div>
              <button
                className={styles.retryButton}
                type="button"
                disabled={isFetching}
                onClick={() => { void refetch(); }}
              >
                <RefreshIcon className={isFetching ? styles.refreshing : undefined} />
                {t(isFetching ? 'tasks.list.retrying' : 'tasks.list.retry')}
              </button>
            </div>
          )}
          {data?.views.map((view) => (
            <TaskListView
              key={view.id}
              view={view}
              title={t(view.section === 'all' ? 'pages.inbox.tasks' : `pages.inbox.sections.${view.section}`)}
              canCreateTask={view.section === 'today'}
              showProgress={!HIDDEN_PROGRESS_BAR_SECTIONS.includes(view.section)}
            />
          ))}
        </div>

        <aside className={styles.widgets} aria-labelledby="inbox-overview-title">
          <section className={styles.overview}>
            <h2 className={styles.overviewTitle} id="inbox-overview-title">
              {t('pages.inbox.overview.title')}
            </h2>
            <dl className={styles.counts}>
              <div className={styles.count}>
                <dt>{t('pages.inbox.overview.total')}</dt>
                <dd>—</dd>
              </div>
              <div className={styles.count}>
                <dt>{t('pages.inbox.overview.completed')}</dt>
                <dd>—</dd>
              </div>
              <div className={styles.count}>
                <dt>{t('pages.inbox.overview.remaining')}</dt>
                <dd>—</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
