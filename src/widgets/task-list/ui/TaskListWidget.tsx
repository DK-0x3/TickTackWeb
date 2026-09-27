import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { Task } from '@/entities/task';
import { CreateTaskForm } from '@/features/create-task';

import { TaskList } from './TaskList';
import { TaskListHeader } from './TaskListHeader';
import {
  TaskActionError,
  TaskListEmpty,
  TaskListError,
  TaskListSkeleton,
} from './TaskListState';
import styles from './TaskListWidget.module.scss';

export type TaskListStatus = 'error' | 'loading' | 'success';

interface TaskListWidgetProps {
  actionErrorMessage?: string | null;
  completedCount: number;
  createErrorMessage?: string | null;
  headerIcon?: ReactNode;
  hasMore: boolean;
  isCreating?: boolean;
  isLoadingMore: boolean;
  loadErrorMessage?: string | null;
  loadMoreErrorMessage?: string | null;
  status: TaskListStatus;
  tasks: readonly Task[];
  title: string;
  totalCount: number;
  updatingTaskIds?: ReadonlySet<string>;
  onCreateTask: (title: string) => Promise<boolean>;
  onDeleteTask?: (task: Task) => void;
  onDismissActionError?: () => void;
  onLoadMore: () => void;
  onOpenSettings?: () => void;
  onRetry: () => void;
  onResetCreateError?: () => void;
  onToggleCompleted: (task: Task) => void;
}

const emptyTaskIds = new Set<string>();

export function TaskListWidget({
  actionErrorMessage,
  completedCount,
  createErrorMessage,
  headerIcon,
  hasMore,
  isCreating = false,
  isLoadingMore,
  loadErrorMessage,
  loadMoreErrorMessage,
  status,
  tasks,
  title,
  totalCount,
  updatingTaskIds = emptyTaskIds,
  onCreateTask,
  onDeleteTask,
  onDismissActionError,
  onLoadMore,
  onOpenSettings,
  onRetry,
  onResetCreateError,
  onToggleCompleted,
}: TaskListWidgetProps) {
  const { t } = useTranslation();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const loadMoreTarget = useRef<HTMLDivElement>(null);
  const handleOpenCreateForm = () => {
    onResetCreateError?.();
    setIsCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    onResetCreateError?.();
    setIsCreateFormOpen(false);
  };

  useEffect(() => {
    if (status !== 'success' || !hasMore || isLoadingMore || loadMoreErrorMessage) {
      return;
    }

    const target = loadMoreTarget.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onLoadMore();
      }
    }, { rootMargin: '0px 0px 320px 0px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMoreErrorMessage, onLoadMore, status]);

  return (
    <section className={styles.widget}>
      <TaskListHeader
        completedCount={completedCount}
        headerIcon={headerIcon}
        isCreateFormOpen={isCreateFormOpen}
        title={title}
        totalCount={totalCount}
        onAddTask={handleOpenCreateForm}
        {...(onOpenSettings ? { onOpenSettings } : {})}
      />

      {isCreateFormOpen
        ? (
            <CreateTaskForm
              errorMessage={createErrorMessage ?? null}
              isSubmitting={isCreating}
              onCancel={handleCloseCreateForm}
              onSubmit={onCreateTask}
            />
          )
        : null}

      <div className={styles.content} aria-live="polite">
        {actionErrorMessage
          ? (
              <TaskActionError
                message={actionErrorMessage}
                {...(onDismissActionError
                  ? { onDismiss: onDismissActionError }
                  : {})}
              />
            )
          : null}
        {status === 'loading' ? <TaskListSkeleton /> : null}
        {status === 'error'
          ? (
              <TaskListError
                message={loadErrorMessage ?? null}
                onRetry={onRetry}
              />
            )
          : null}
        {status === 'success' && tasks.length === 0 && !hasMore
          ? <TaskListEmpty />
          : null}
        {status === 'success' && tasks.length > 0
          ? (
              <TaskList
                tasks={tasks}
                updatingTaskIds={updatingTaskIds}
                onToggleCompleted={onToggleCompleted}
                {...(onDeleteTask ? { onDeleteTask } : {})}
              />
            )
          : null}
        {status === 'success' && hasMore
          ? (
              <div className={styles.paginationState} ref={loadMoreTarget}>
                {isLoadingMore
                  ? <span role="status">{t('tasks.list.loadingMore')}</span>
                  : null}
                {loadMoreErrorMessage
                  ? (
                      <div role="alert">
                        <p>{loadMoreErrorMessage}</p>
                        <button
                          className={styles.retryButton}
                          type="button"
                          onClick={onLoadMore}
                        >
                          {t('tasks.list.retry')}
                        </button>
                      </div>
                    )
                  : null}
              </div>
            )
          : null}
      </div>
    </section>
  );
}
