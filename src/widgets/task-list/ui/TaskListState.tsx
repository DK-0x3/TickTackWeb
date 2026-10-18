import { useTranslation } from 'react-i18next';

import { XIcon } from '@/shared/ui/icon';

import styles from './TaskListWidget.module.scss';

const skeletonItems = [0, 1, 2, 3];

export function TaskListSkeleton() {
  return (
    <div className={styles.skeletonList} aria-hidden="true">
      {skeletonItems.map((item) => (
        <div className={styles.skeletonItem} key={item}>
          <span className={styles.skeletonCheckbox} />
          <span className={styles.skeletonTitle} />
          <span className={styles.skeletonPriority} />
        </div>
      ))}
    </div>
  );
}

export function TaskListEmpty({ completedHidden = false, compact = false }: { completedHidden?: boolean; compact?: boolean }) {
  const { t } = useTranslation();

  return (
    <div className={compact ? styles.headerEmpty : styles.state}>
      <h2 className={styles.stateTitle}>{t(completedHidden ? 'tasks.list.completedHiddenTitle' : 'tasks.list.emptyTitle')}</h2>
      <p className={styles.stateDescription}>
        {t(completedHidden ? 'tasks.list.completedHiddenDescription' : 'tasks.list.emptyDescription')}
      </p>
    </div>
  );
}

interface TaskListErrorProps {
  message?: string | null;
  onRetry: () => void;
}

export function TaskListError({ message, onRetry }: TaskListErrorProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.state} role="alert">
      <h2 className={styles.stateTitle}>{t('tasks.list.errorTitle')}</h2>
      <p className={styles.stateDescription}>
        {message ?? t('tasks.list.errorDescription')}
      </p>
      <button className={styles.retryButton} type="button" onClick={onRetry}>
        {t('tasks.list.retry')}
      </button>
    </div>
  );
}

interface TaskActionErrorProps {
  message: string;
  onDismiss?: () => void;
}

export function TaskActionError({
  message,
  onDismiss,
}: TaskActionErrorProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.errorBanner} role="alert">
      <span>{message}</span>
      {onDismiss
        ? (
            <button
              className={styles.errorDismissButton}
              type="button"
              aria-label={t('errors.dismiss')}
              title={t('errors.dismiss')}
              onClick={onDismiss}
            >
              <XIcon />
            </button>
          )
        : null}
    </div>
  );
}
