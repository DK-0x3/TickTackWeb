import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { ChevronDownIcon, ChevronUpIcon, EllipsisIcon, PlusIcon } from '@/shared/ui/icon';

import styles from './TaskListWidget.module.scss';
import { TaskListEmpty } from './TaskListState';

interface TaskListHeaderProps {
  contentId: string;
  isCollapsed: boolean;
  isCollapseSaving: boolean;
  onCollapsedChange?: (value: boolean) => void;
  completedCount: number;
  headerIcon?: ReactNode;
  settingsAction?: ReactNode;
  isCreateFormOpen: boolean;
  title: string;
  totalCount: number;
  visibleCount?: number;
  isEmpty?: boolean;
  onAddTask?: () => void;
  showProgress?: boolean;
  onOpenSettings?: () => void;
}

export function TaskListHeader({
  contentId,
  isCollapsed,
  isCollapseSaving,
  onCollapsedChange,
  completedCount,
  headerIcon,
  settingsAction,
  isCreateFormOpen,
  title,
  totalCount,
  visibleCount = totalCount,
  isEmpty = false,
  onAddTask,
  showProgress = true,
  onOpenSettings,
}: TaskListHeaderProps) {
  const { t } = useTranslation();
  const progress = totalCount === 0
    ? 0
    : Math.round((completedCount / totalCount) * 100);

  return (
    <header className={styles.header}>
      <div className={styles.titleRow} data-has-progress={showProgress || isEmpty}>
        <div className={styles.titleGroup}>
          {onCollapsedChange && !isEmpty
            ? (
                <button
                  className={styles.collapseToggle}
                  type="button"
                  aria-expanded={!isCollapsed}
                  aria-controls={contentId}
                  aria-busy={isCollapseSaving}
                  aria-label={t(isCollapsed ? 'tasks.list.expand' : 'tasks.list.collapse', { title })}
                  title={t(isCollapsed ? 'tasks.list.expand' : 'tasks.list.collapse', { title })}
                  disabled={isCollapseSaving}
                  onClick={() => onCollapsedChange(!isCollapsed)}
                >
                  {isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
                </button>
              )
            : null}
          {headerIcon ? <span className={styles.headerIcon}>{headerIcon}</span> : null}
          <h2 className={styles.title}>{title}</h2>
          <span
            className={styles.count}
            aria-label={t('tasks.list.visibleCount', { count: visibleCount })}
          >
            {visibleCount}
          </span>
        </div>

        {isEmpty
          ? <TaskListEmpty compact />
          : showProgress
            ? (
                <div className={styles.progressRow}>
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
              )
            : null}

        <div className={styles.headerActions}>
          {onAddTask && (
            <button
              className={styles.addButton}
              type="button"
              disabled={(isCreateFormOpen && !isCollapsed) || (isCollapsed && isCollapseSaving)}
              onClick={onAddTask}
            >
              <PlusIcon />
              <span>{t('tasks.list.add')}</span>
            </button>
          )}
          {settingsAction ?? (onOpenSettings
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
            : null)}
        </div>
      </div>
    </header>
  );
}
