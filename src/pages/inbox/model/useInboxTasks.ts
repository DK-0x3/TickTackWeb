import {
  type CreateTaskInput,
  type Task,
  type TaskScheduleInput,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetTasksInfiniteQuery,
  useLazyGetTaskQuery,
  useRestoreTaskMutation,
  useSetTaskCompletedMutation,
  useSetTaskScheduleMutation,
} from '@/entities/task';
import { normalizeApiError, useApiErrorMessage } from '@/shared/api';
import { useNotifications, type NotificationAction } from '@/shared/lib/notifications';
import { TrashIcon } from '@/shared/ui/icon';
import { createElement, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const UNDO_DURATION_MS = 3300;

type TaskPresence = 'present' | 'missing' | 'unknown';
interface HiddenTask {
  version: number;
  pending: boolean;
}

const isTaskHidden = (task: Task, hiddenTasks: ReadonlyMap<string, HiddenTask>): boolean => {
  const hidden = hiddenTasks.get(task.id);
  return hidden !== undefined && (hidden.pending || task.version <= hidden.version);
};

export const useInboxTasks = () => {
  const { t } = useTranslation();
  const getErrorMessage = useApiErrorMessage();
  const notifications = useNotifications();
  const [updatingTaskIds, setUpdatingTaskIds] = useState(
    () => new Set<string>(),
  );
  const [taskActionError, setTaskActionError] = useState<{
    error: unknown;
    fallback: 'errors.updateTask' | 'errors.deleteTask';
  } | null>(null);
  const [isTaskStatusUnconfirmed, setIsTaskStatusUnconfirmed] = useState(false);
  const [isTaskScheduleUnconfirmed, setIsTaskScheduleUnconfirmed] = useState(false);
  const [isTaskDeletionUnconfirmed, setIsTaskDeletionUnconfirmed] = useState(false);
  const [hiddenTasks, setHiddenTasks] = useState(() => new Map<string, HiddenTask>());
  const [loadMoreError, setLoadMoreError] = useState<unknown>(null);
  const loadMoreInFlight = useRef(false);
  const updatingTaskIdsInFlight = useRef(new Set<string>());
  const deletingTaskIdsInFlight = useRef(new Set<string>());

  const {
    data,
    error: loadError,
    isError: isLoadError,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGetTasksInfiniteQuery();

  const tasks = useMemo(() => {
    const seen = new Set<string>();

    return (data?.pages ?? []).flatMap(({ items }) =>
      items.filter((task) => {
        if (seen.has(task.id) || isTaskHidden(task, hiddenTasks)) {
          return false;
        }

        seen.add(task.id);
        return true;
      }),
    );
  }, [data, hiddenTasks]);
  const latestPage = data?.pages.at(-1);

  const [triggerCreateTask, {
    error: createError,
    isLoading: isCreating,
    reset: resetCreateTask,
  }] = useCreateTaskMutation();

  const [triggerSetCompleted] = useSetTaskCompletedMutation();
  const [triggerSetSchedule] = useSetTaskScheduleMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [restoreTask] = useRestoreTaskMutation();
  const [fetchTask] = useLazyGetTaskQuery();

  const checkTaskPresence = async (id: string): Promise<TaskPresence> => {
    try {
      await fetchTask(id, false).unwrap();
      return 'present';
    } catch (error) {
      const normalized = normalizeApiError(error);
      return normalized.status === 404 && normalized.code === 'task_not_found'
        ? 'missing'
        : 'unknown';
    }
  };

  const handleCreateTask = async (input: CreateTaskInput): Promise<boolean> => {
    resetCreateTask();

    try {
      await triggerCreateTask(input).unwrap();
      setLoadMoreError(null);
      return true;
    } catch {
      return false;
    }
  };

  const handleToggleCompleted = async (task: Task): Promise<boolean> => {
    if (updatingTaskIdsInFlight.current.has(task.id)
      || deletingTaskIdsInFlight.current.has(task.id)
      || isTaskHidden(task, hiddenTasks)) {
      return false;
    }

    updatingTaskIdsInFlight.current.add(task.id);
    setTaskActionError(null);
    setIsTaskStatusUnconfirmed(false);
    setIsTaskScheduleUnconfirmed(false);
    setIsTaskDeletionUnconfirmed(false);
    setUpdatingTaskIds((current) => {
      const next = new Set(current);
      next.add(task.id);
      return next;
    });

    const completed = task.completedAt === null;
    try {
      await triggerSetCompleted({
        id: task.id,
        completed,
      }).unwrap();

      setLoadMoreError(null);
      return true;
    } catch (error) {
      try {
        const refreshed = await refetch().unwrap();
        const currentTask = refreshed.pages
          .flatMap(({ items }) => items)
          .find(({ id }) => id === task.id);

        if (currentTask && (currentTask.completedAt !== null) === completed) {
          setLoadMoreError(null);
          return true;
        }

        setTaskActionError({ error, fallback: 'errors.updateTask' });
        return false;
      } catch {
        setIsTaskStatusUnconfirmed(true);
        return false;
      }
    } finally {
      updatingTaskIdsInFlight.current.delete(task.id);
      setUpdatingTaskIds((current) => {
        const next = new Set(current);
        next.delete(task.id);

        return next;
      });
    }
  };

  const handleSetSchedule = async (task: Task, schedule: TaskScheduleInput): Promise<boolean> => {
    if (updatingTaskIdsInFlight.current.has(task.id)
      || deletingTaskIdsInFlight.current.has(task.id)
      || isTaskHidden(task, hiddenTasks)) return false;

    updatingTaskIdsInFlight.current.add(task.id);
    setTaskActionError(null);
    setIsTaskStatusUnconfirmed(false);
    setIsTaskScheduleUnconfirmed(false);
    setIsTaskDeletionUnconfirmed(false);
    setUpdatingTaskIds((current) => new Set(current).add(task.id));

    try {
      await triggerSetSchedule({ id: task.id, ...schedule }).unwrap();
      setLoadMoreError(null);
      return true;
    } catch (error) {
      try {
        const refreshed = await refetch().unwrap();
        const currentTask = refreshed.pages
          .flatMap(({ items }) => items)
          .find(({ id }) => id === task.id);

        if (currentTask?.dueDate === schedule.dueDate
          && currentTask.dueTime === schedule.dueTime) return true;

        setTaskActionError({ error, fallback: 'errors.updateTask' });
        return false;
      } catch {
        setIsTaskScheduleUnconfirmed(true);
        return false;
      }
    } finally {
      updatingTaskIdsInFlight.current.delete(task.id);
      setUpdatingTaskIds((current) => {
        const next = new Set(current);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleDeleteTask = async (task: Task): Promise<void> => {
    if (deletingTaskIdsInFlight.current.has(task.id)
      || updatingTaskIdsInFlight.current.has(task.id)
      || isTaskHidden(task, hiddenTasks)) return;

    deletingTaskIdsInFlight.current.add(task.id);
    setHiddenTasks((current) => new Map(current).set(task.id, {
      version: task.version,
      pending: true,
    }));
    setTaskActionError(null);
    setIsTaskStatusUnconfirmed(false);
    setIsTaskScheduleUnconfirmed(false);
    setIsTaskDeletionUnconfirmed(false);

    const noticeId = notifications.show({
      message: t('tasks.delete.deleting', { title: task.title }),
      icon: createElement(TrashIcon),
      durationMs: null,
    });

    const markRestored = () => {
      setHiddenTasks((current) => {
        const next = new Map(current);
        next.delete(task.id);
        return next;
      });
    };

    const undoAction: NotificationAction = {
      label: t('tasks.delete.undo'),
      shortcut: { key: 'z', mod: true },
      run: async () => {
        notifications.update(noticeId, {
          message: t('tasks.delete.undoing'),
          action: null,
          durationMs: null,
        });

        try {
          await restoreTask(task.id).unwrap();
          markRestored();
        } catch (error) {
          const presence = await checkTaskPresence(task.id);
          if (presence === 'present') {
            markRestored();
            return;
          }

          notifications.update(noticeId, {
            message: presence === 'unknown'
              ? t('errors.taskRestorationUnconfirmed')
              : getErrorMessage(error, 'errors.restoreTask') ?? t('errors.restoreTask'),
            tone: 'error',
            action: { ...undoAction, label: t('tasks.list.retry') },
            durationMs: UNDO_DURATION_MS,
          });
          throw error;
        }
      },
    };

    const showUndo = () => {
      setHiddenTasks((current) => new Map(current).set(task.id, {
        version: task.version,
        pending: false,
      }));
      notifications.update(noticeId, {
        message: t('tasks.delete.notice', { title: task.title }),
        tone: 'neutral',
        action: undoAction,
        durationMs: UNDO_DURATION_MS,
      });
    };

    try {
      await deleteTask(task.id).unwrap();
      showUndo();
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 404 && normalized.code === 'task_not_found') {
        showUndo();
        return;
      }

      const presence = normalized.kind === 'client'
        ? 'present'
        : await checkTaskPresence(task.id);
      if (presence === 'missing') {
        showUndo();
        return;
      }

      markRestored();
      notifications.dismiss(noticeId);
      if (presence === 'unknown') {
        setIsTaskDeletionUnconfirmed(true);
      } else {
        setTaskActionError({ error, fallback: 'errors.deleteTask' });
      }
    } finally {
      deletingTaskIdsInFlight.current.delete(task.id);
    }
  };

  const handleRetry = () => {
    void refetch();
  };

  const handleLoadMore = async () => {
    if (!hasNextPage || isFetching || loadMoreInFlight.current) {
      return;
    }

    loadMoreInFlight.current = true;
    setLoadMoreError(null);
    try {
      await fetchNextPage().unwrap();
    } catch (error) {
      setLoadMoreError(error);
    } finally {
      loadMoreInFlight.current = false;
    }
  };

  const status: 'error' | 'loading' | 'success' = isLoading
    ? 'loading'
    : isLoadError && data === undefined
      ? 'error'
      : 'success';

  return {
    actionErrorMessage: isTaskDeletionUnconfirmed
      ? t('errors.taskDeletionUnconfirmed')
      : isTaskScheduleUnconfirmed
        ? t('errors.taskScheduleUnconfirmed')
        : isTaskStatusUnconfirmed
          ? t('errors.taskStatusUnconfirmed')
          : taskActionError
            ? getErrorMessage(taskActionError.error, taskActionError.fallback)
            : null,
    createErrorMessage: getErrorMessage(createError, 'errors.createTask'),
    completedCount: latestPage?.completedTotal ?? 0,
    isCreating,
    hasMore: Boolean(hasNextPage),
    isLoadingMore: isFetchingNextPage,
    loadErrorMessage: getErrorMessage(loadError, 'errors.loadTasks'),
    loadMoreErrorMessage: getErrorMessage(loadMoreError, 'errors.loadTasks'),
    status,
    tasks,
    totalCount: latestPage?.total ?? 0,
    updatingTaskIds,
    onCreateTask: handleCreateTask,
    onDismissActionError: () => {
      setTaskActionError(null);
      setIsTaskStatusUnconfirmed(false);
      setIsTaskScheduleUnconfirmed(false);
      setIsTaskDeletionUnconfirmed(false);
    },
    onLoadMore: handleLoadMore,
    onResetCreateError: resetCreateTask,
    onRetry: handleRetry,
    onToggleCompleted: handleToggleCompleted,
    onSetSchedule: handleSetSchedule,
    onDeleteTask: handleDeleteTask,
  };
};
