import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type Task,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetTasksInfiniteQuery,
  useLazyGetTaskQuery,
  useRestoreTaskMutation,
  useSetTaskCompletedMutation,
} from '@/entities/task';
import { useApiErrorMessage } from '@/shared/api';

import { useInboxTasks } from './useInboxTasks';

vi.mock('@/entities/task', () => ({
  useCreateTaskMutation: vi.fn(),
  useDeleteTaskMutation: vi.fn(),
  useGetTasksInfiniteQuery: vi.fn(),
  useLazyGetTaskQuery: vi.fn(),
  useRestoreTaskMutation: vi.fn(),
  useSetTaskCompletedMutation: vi.fn(),
}));

vi.mock('@/shared/api', () => ({
  normalizeApiError: vi.fn(),
  useApiErrorMessage: vi.fn(),
}));

vi.mock('@/shared/lib/notifications', () => ({
  useNotifications: () => ({
    show: vi.fn(),
    update: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

const makeTask = (id: string): Task => ({
  id,
  userId: 'user-1',
  title: `Task ${id}`,
  description: null,
  priority: 'none',
  completedAt: null,
  createdAt: '2026-09-25T12:00:00Z',
  updatedAt: '2026-09-25T12:00:00Z',
  version: 1,
});

const fetchNextPage = vi.fn();
const refetch = vi.fn();

beforeEach(() => {
  fetchNextPage.mockReset();
  refetch.mockReset();
  vi.mocked(useGetTasksInfiniteQuery).mockReturnValue({
    data: {
      pages: [
        { items: [makeTask('a'), makeTask('b')], nextCursor: 'cursor-1', total: 3, completedTotal: 1 },
        { items: [makeTask('b'), makeTask('c')], nextCursor: null, total: 3, completedTotal: 2 },
      ],
      pageParams: [null, 'cursor-1'],
    },
    isLoading: false,
    isFetching: false,
    isFetchingNextPage: false,
    isError: false,
    hasNextPage: true,
    fetchNextPage,
    refetch,
  } as unknown as ReturnType<typeof useGetTasksInfiniteQuery>);
  vi.mocked(useCreateTaskMutation).mockReturnValue([
    vi.fn(),
    { error: undefined, isLoading: false, reset: vi.fn() },
  ] as unknown as ReturnType<typeof useCreateTaskMutation>);
  vi.mocked(useSetTaskCompletedMutation).mockReturnValue([
    vi.fn(),
    {},
  ] as unknown as ReturnType<typeof useSetTaskCompletedMutation>);
  vi.mocked(useDeleteTaskMutation).mockReturnValue([
    vi.fn(),
    {},
  ] as unknown as ReturnType<typeof useDeleteTaskMutation>);
  vi.mocked(useRestoreTaskMutation).mockReturnValue([
    vi.fn(),
    {},
  ] as unknown as ReturnType<typeof useRestoreTaskMutation>);
  vi.mocked(useLazyGetTaskQuery).mockReturnValue([
    vi.fn(),
    {},
    {},
  ] as unknown as ReturnType<typeof useLazyGetTaskQuery>);
  vi.mocked(useApiErrorMessage).mockReturnValue((error, fallback) => (
    error === null || error === undefined ? null : (fallback ?? null)
  ));
});

describe('useInboxTasks', () => {
  it('combines pages without showing duplicate tasks', () => {
    const { result } = renderHook(() => useInboxTasks());
    expect(result.current.tasks.map(({ id }) => id)).toEqual(['a', 'b', 'c']);
    expect(result.current.totalCount).toBe(3);
    expect(result.current.completedCount).toBe(2);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.status).toBe('success');
  });

  it('prevents a second page request while the first one is in flight', async () => {
    let resolve!: () => void;
    const pending = new Promise<void>((done) => {
      resolve = done;
    });
    fetchNextPage.mockReturnValue({ unwrap: () => pending });
    const { result } = renderHook(() => useInboxTasks());

    let first!: Promise<void>;
    act(() => {
      first = result.current.onLoadMore();
      void result.current.onLoadMore();
    });
    expect(fetchNextPage).toHaveBeenCalledOnce();
    await act(async () => {
      resolve();
      await first;
    });
  });

  it('does not request another page when none remains', async () => {
    vi.mocked(useGetTasksInfiniteQuery).mockReturnValue({
      data: { pages: [{ items: [], nextCursor: null, total: 0, completedTotal: 0 }], pageParams: [null] },
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      hasNextPage: false,
      fetchNextPage,
      refetch,
    } as unknown as ReturnType<typeof useGetTasksInfiniteQuery>);
    const { result } = renderHook(() => useInboxTasks());
    await act(async () => result.current.onLoadMore());
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('ignores a second completion click on the same task while saving', async () => {
    let resolve!: (task: Task) => void;
    const pending = new Promise<Task>((done) => {
      resolve = done;
    });
    const trigger = vi.fn(() => ({ unwrap: () => pending }));
    vi.mocked(useSetTaskCompletedMutation).mockReturnValue([
      trigger,
      {},
    ] as unknown as ReturnType<typeof useSetTaskCompletedMutation>);
    const task = makeTask('a');
    const { result } = renderHook(() => useInboxTasks());

    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = result.current.onToggleCompleted(task);
      second = result.current.onToggleCompleted(task);
    });
    expect(trigger).toHaveBeenCalledOnce();
    expect(result.current.updatingTaskIds.has(task.id)).toBe(true);

    await act(async () => {
      resolve(task);
      expect(await first).toBe(true);
      expect(await second).toBe(false);
    });
    expect(result.current.updatingTaskIds.has(task.id)).toBe(false);
  });

  it('hides the mutation error when a fresh read confirms the requested status', async () => {
    const trigger = vi.fn(() => ({ unwrap: () => Promise.reject(new Error('response lost')) }));
    vi.mocked(useSetTaskCompletedMutation).mockReturnValue([
      trigger,
      {},
    ] as unknown as ReturnType<typeof useSetTaskCompletedMutation>);
    refetch.mockReturnValue({ unwrap: () => Promise.resolve({
      pages: [{ items: [{ ...makeTask('a'), completedAt: '2026-09-25T12:30:00Z' }], nextCursor: null, total: 1, completedTotal: 1 }],
      pageParams: [null],
    }) });
    const { result } = renderHook(() => useInboxTasks());

    let confirmed!: boolean;
    await act(async () => {
      confirmed = await result.current.onToggleCompleted(makeTask('a'));
    });
    expect(confirmed).toBe(true);
    expect(refetch).toHaveBeenCalledOnce();
    expect(result.current.actionErrorMessage).toBeNull();
  });

  it('shows an error when a fresh read confirms the old status', async () => {
    vi.mocked(useSetTaskCompletedMutation).mockReturnValue([
      vi.fn(() => ({ unwrap: () => Promise.reject(new Error('save failed')) })),
      {},
    ] as unknown as ReturnType<typeof useSetTaskCompletedMutation>);
    refetch.mockReturnValue({ unwrap: () => Promise.resolve({
      pages: [{ items: [makeTask('a')], nextCursor: null, total: 1, completedTotal: 0 }],
      pageParams: [null],
    }) });
    const { result } = renderHook(() => useInboxTasks());

    let confirmed!: boolean;
    await act(async () => {
      confirmed = await result.current.onToggleCompleted(makeTask('a'));
    });
    expect(confirmed).toBe(false);
    expect(result.current.actionErrorMessage).toBe('errors.updateTask');
  });

  it('reports an unknown outcome when the fresh read also fails', async () => {
    vi.mocked(useSetTaskCompletedMutation).mockReturnValue([
      vi.fn(() => ({ unwrap: () => Promise.reject(new Error('response lost')) })),
      {},
    ] as unknown as ReturnType<typeof useSetTaskCompletedMutation>);
    refetch.mockReturnValue({ unwrap: () => Promise.reject(new Error('offline')) });
    const { result } = renderHook(() => useInboxTasks());

    let confirmed!: boolean;
    await act(async () => {
      confirmed = await result.current.onToggleCompleted(makeTask('a'));
    });
    expect(confirmed).toBe(false);
    expect(result.current.actionErrorMessage).toBe(
      'Could not confirm whether the task was updated. Check again when connected.',
    );
  });
});
