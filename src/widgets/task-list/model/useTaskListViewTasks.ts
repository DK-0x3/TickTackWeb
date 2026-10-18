import { type TaskViewDto, useGetViewTasksPageInfiniteQuery, useLazyGetInboxViewsQuery } from '@/entities/task-view';
import type { TaskListStatus } from '../ui/TaskListWidget';
import { createElement, useCallback, useMemo, useRef, useState } from 'react';
import {
  type CreateTaskInput,
  type Task,
  type TaskScheduleInput,
  useCreateTaskMutation, useDeleteTaskMutation, useLazyGetTaskQuery, useRestoreTaskMutation,
  useSetTaskCompletedMutation, useSetTaskScheduleMutation,
} from '@/entities/task';
import { normalizeApiError, useApiErrorMessage } from '@/shared/api';
import { useTranslation } from 'react-i18next';
import { type NotificationAction, useNotifications } from '@/shared/lib/notifications';
import { TrashIcon } from '@/shared/ui/icon';
import { useTaskViewRefresh } from './useTaskViewRefresh';

const UNDO_DURATION_MS = 3300;

type TaskPresence = 'present' | 'missing' | 'unknown';

interface HiddenTask {
  version: number;
  pending: boolean;
}

export function useTaskListViewTasks(view: TaskViewDto) {
  const getErrorMessage = useApiErrorMessage();
  const { t } = useTranslation();
  const notifications = useNotifications();

  const [hiddenTasks, setHiddenTasks] = useState<Map<string, HiddenTask>>(new Map());
  const [loadMoreFailure, setLoadMoreError] = useState<{ queryKey: string; error: unknown } | null>(null);
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());
  const [taskActionError, setTaskActionError] = useState<{
    error: unknown;
    fallback: 'errors.updateTask' | 'errors.deleteTask';
  } | null>(null);
  const [isTaskStatusUnconfirmed, setIsTaskStatusUnconfirmed] = useState(false);
  const [isTaskDeletionUnconfirmed, setIsTaskDeletionUnconfirmed] = useState(false);
  const [isTaskScheduleUnconfirmed, setIsTaskScheduleUnconfirmed] = useState(false);

  const loadMoreInFlight = useRef<boolean>(false);
  const updatingTaskIdsInFlight = useRef<Set<string>>(new Set());
  const deletingTaskIdsInFlight = useRef<Set<string>>(new Set());
  const restartInFlight = useRef(false);
  const queryKey = `${view.id}:${view.version}:${refreshGeneration}`;
  const loadMoreError = loadMoreFailure?.queryKey === queryKey ? loadMoreFailure.error : null;
  const [fetchInboxViews] = useLazyGetInboxViewsQuery();

  const restartPages = useCallback(() => {
    if (restartInFlight.current) return;
    restartInFlight.current = true;
    setLoadMoreError(null);
    setRefreshGeneration((current) => current + 1);
    // Metadata refresh also picks up settings changed in another tab/device.
    void fetchInboxViews(undefined, false).unwrap().catch(() => undefined).finally(() => {
      restartInFlight.current = false;
    });
  }, [fetchInboxViews]);

  const {
    currentData: data,
    error: loadError,
    isError: isLoadError,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useGetViewTasksPageInfiniteQuery({
    viewId: view.id,
    version: view.version,
    refreshGeneration,
  });

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

  const tasks = useMemo(() => {
    const seen = new Set<string>();
    return (data?.pages ?? []).flatMap(({ items }) =>
      items.filter((task) => {
        if (seen.has(task.id) || hiddenTasks.has(task.id)) {
          return false;
        }
        seen.add(task.id);
        return true;
      }),
    );
  }, [data, hiddenTasks]);
  const latestPage = data?.pages.at(-1);

  useTaskViewRefresh({
    nextRefreshAt: latestPage?.nextRefreshAt,
    error: loadError ?? loadMoreError,
    hasFreshData: data !== undefined && !isFetching,
    onRestart: restartPages,
  });

  const status: TaskListStatus = isLoading || (isFetching && data === undefined) ? 'loading' : (isLoadError && data === undefined ? 'error' : 'success');

  const handleRetry = () => {
    restartPages();
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
      setLoadMoreError({ queryKey, error });
    } finally {
      loadMoreInFlight.current = false;
    }
  };

  const handleCreateTask = async (input: CreateTaskInput): Promise<boolean> => {
    resetCreateTask();
    const title = input.title.trim();
    if (title.length === 0) {
      return false;
    }

    try {
      await triggerCreateTask({
        ...input,
        title,
      }).unwrap();
      return true;
    } catch {
      return false;
    }
  };

  const handleToggleCompleted = async (task: Task): Promise<boolean> => {
    if (updatingTaskIdsInFlight.current.has(task.id)
      || deletingTaskIdsInFlight.current.has(task.id)
      || hiddenTasks.has(task.id)) {
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
        const currentTask = await fetchTask(task.id, false).unwrap();
        if ((currentTask.completedAt !== null) === completed) {
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
      || hiddenTasks.has(task.id)) return false;

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
        const currentTask = await fetchTask(task.id, false).unwrap();
        if (currentTask.dueDate === schedule.dueDate
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

  const handleDeleteTask = async (task: Task) => {
    if (updatingTaskIdsInFlight.current.has(task.id)
      || deletingTaskIdsInFlight.current.has(task.id)
      || hiddenTasks.has(task.id)) {
      return;
    }

    deletingTaskIdsInFlight.current.add(task.id);
    setHiddenTasks((current) => {
      const next = new Map(current);
      next.set(task.id, {
        version: task.version,
        pending: true,
      });
      return next;
    });
    setTaskActionError(null);
    setIsTaskStatusUnconfirmed(false);
    setIsTaskDeletionUnconfirmed(false);
    setIsTaskScheduleUnconfirmed(false);

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
      shortcut: { key: 'Z', mod: true },
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
      setHiddenTasks((current) => {
        const next = new Map(current);
        next.set(task.id, {
          version: task.version,
          pending: false,
        });
        return next;
      });
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
      const apiError = normalizeApiError(error);
      if (apiError.status === 404 || apiError.code === 'not_found') {
        showUndo();
        return;
      }

      const presence = apiError.kind === 'client'
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
        setTaskActionError({
          error,
          fallback: 'errors.deleteTask',
        });
      }
    } finally {
      deletingTaskIdsInFlight.current.delete(task.id);
    }
  };

  const actionErrorMessage = isTaskDeletionUnconfirmed
    ? t('errors.taskDeletionUnconfirmed')
    : isTaskScheduleUnconfirmed
      ? t('errors.taskScheduleUnconfirmed')
      : isTaskStatusUnconfirmed
        ? t('errors.taskStatusUnconfirmed')
        : taskActionError
          ? getErrorMessage(taskActionError.error, taskActionError.fallback)
          : null;

  const createErrorMessage = createError ? getErrorMessage(createError) : null;
  const loadErrorMessage = (isLoadError && loadError) ? getErrorMessage(loadError) : null;
  const loadMoreErrorMessage = loadMoreError ? getErrorMessage(loadMoreError) : null;

  return {
    completedCount: latestPage?.completedTotal ?? 0,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    status,
    tasks,
    totalCount: latestPage?.total ?? 0,
    visibleCount: latestPage?.visibleTotal ?? 0,
    ...(latestPage ? { serverToday: latestPage.today } : {}),
    onCreateTask: handleCreateTask,
    onLoadMore: () => void handleLoadMore(),
    onRetry: handleRetry,
    onToggleCompleted: (task: Task) => void handleToggleCompleted(task),
    actionErrorMessage,
    createErrorMessage,
    isCreating,
    loadErrorMessage,
    loadMoreErrorMessage,
    updatingTaskIds,
    onDeleteTask: (task: Task) => void handleDeleteTask(task),
    onResetCreateError: resetCreateTask,
    onSetSchedule: handleSetSchedule,
    onDismissActionError: () => {
      setTaskActionError(null);
      setIsTaskStatusUnconfirmed(false);
      setIsTaskDeletionUnconfirmed(false);
      setIsTaskScheduleUnconfirmed(false);
    },
  };
}
