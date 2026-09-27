import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { EllipsisIcon, PlusIcon } from '@/shared/ui/icon';

import styles from './TaskListWidget.module.scss';

interface TaskListHeaderProps {
  completedCount: number;
  headerIcon?: ReactNode;
  isCreateFormOpen: boolean;
  title: string;
  totalCount: number;
  onAddTask: () => void;
  onOpenSettings?: () => void;
}

export function TaskListHeader({
  completedCount,
  headerIcon,
  isCreateFormOpen,
  title,
  totalCount,
  onAddTask,
  onOpenSettings,
}: TaskListHeaderProps) {
  const { t } = useTranslation();
  const progress = totalCount === 0
    ? 0
    : Math.round((completedCount / totalCount) * 100);

  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        {headerIcon ? <span className={styles.headerIcon}>{headerIcon}</span> : null}
        <h2 className={styles.title}>{title}</h2>
        <span
          className={styles.count}
          aria-label={t('tasks.list.totalCount', { count: totalCount })}
        >
          {totalCount}
        </span>

        <div className={styles.headerActions}>
          <button
            className={styles.addButton}
            type="button"
            disabled={isCreateFormOpen}
            onClick={onAddTask}
          >
            <PlusIcon />
            <span>{t('tasks.list.add')}</span>
          </button>

          {onOpenSettings
            ? (
                <button
                  className={styles.iconButton}
                  type="button"
                  aria-label={t('tasks.list.settings')}
                  title={t('tasks.list.settings')}
                  onClick={onOpenSettings}
                >
                  <EllipsisIcon />
                </button>
              )
            : null}
        </div>
      </div>

      <div className={styles.progressRow}>
        <span className={styles.progressText}>
          {t('tasks.list.completed', {
            completed: completedCount,
            total: totalCount,
          })}
        </span>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label={t('tasks.list.progressLabel')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <span
            className={styles.progressValue}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.progressPercent}>{`${progress}%`}</span>
      </div>
    </header>
  );
}
