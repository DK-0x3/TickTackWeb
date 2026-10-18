import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { baseApi } from '@/shared/api';
import { NotificationProvider } from '@/shared/lib/notifications';
import { useInboxTasks } from '@/pages/inbox/model/useInboxTasks';

import { taskApi, useGetTasksInfiniteQuery } from './taskApi';

const taskDto = (id: string, completedAt: string | null = null, version = 1) => ({
  id,
  user_id: 'user-1',
  title: `Task ${id}`,
  description: null,
  priority: 'none',
  due_date: null,
  due_time: null,
  completed_at: completedAt,
  created_at: '2026-09-25T12:00:00Z',
  updated_at: '2026-09-25T12:00:00Z',
  version,
});

const stubRelativeRequest = () => {
  const NativeRequest = Request;
  vi.stubGlobal('Request', class extends NativeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(typeof input === 'string' ? new URL(input, 'http://localhost') : input, init);
    }
  });
};

const makeStore = () => configureStore({
  reducer: { [baseApi.reducerPath]: baseApi.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

describe('task API pagination', () => {
  it('requests each cursor and maps both page data and total', async () => {
    const requestedUrls: string[] = [];
    stubRelativeRequest();
    vi.stubGlobal('fetch', vi.fn((request: Request) => {
      requestedUrls.push(request.url);
      const isSecondPage = request.url.includes('cursor=cursor-1');
      return Promise.resolve(Response.json(isSecondPage
        ? { items: [taskDto('b')], next_cursor: null, total: 3, completed_total: 2 }
        : { items: [taskDto('a')], next_cursor: 'cursor-1', total: 3, completed_total: 2 }));
    }));

    const store = makeStore();
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>{children}</Provider>
    );
    const { result } = renderHook(() => useGetTasksInfiniteQuery(), { wrapper });

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(1));
    expect(result.current.data?.pages[0]?.items[0]?.userId).toBe('user-1');
    expect(result.current.data?.pages[0]?.total).toBe(3);
    expect(result.current.data?.pages[0]?.completedTotal).toBe(2);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage().unwrap();
    });
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(result.current.data?.pages.map(({ items }) => items[0]?.id)).toEqual(['a', 'b']);
    expect(result.current.data?.pages[1]?.completedTotal).toBe(2);
    expect(result.current.hasNextPage).toBe(false);
    expect(requestedUrls).toHaveLength(2);
    expect(requestedUrls[0]).toContain('/api/tasks?limit=20');
    expect(requestedUrls[1]).toContain('cursor=cursor-1');
  });
});

describe('task API optimistic completion', () => {
  it('updates the cache immediately and replaces the placeholder with server data', async () => {
    stubRelativeRequest();
    const serverCompletedAt = '2026-09-25T12:30:00Z';
    let resolveMutation!: (response: Response) => void;
    const pendingMutation = new Promise<Response>((resolve) => {
      resolveMutation = resolve;
    });
    let serverUpdated = false;
    const fetchMock = vi.fn((request: Request) => {
      if (request.method === 'PATCH') {
        return pendingMutation;
      }
      if (request.url.endsWith('/tasks/a')) {
        return Promise.resolve(Response.json(taskDto('a')));
      }
      return Promise.resolve(Response.json({
        items: [taskDto('a', serverUpdated ? serverCompletedAt : null, serverUpdated ? 2 : 1)],
        next_cursor: null,
        total: 1,
        completed_total: serverUpdated ? 1 : 0,
      }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();
    await store.dispatch(taskApi.endpoints.getTasks.initiate(undefined)).unwrap();
    await store.dispatch(taskApi.endpoints.getTask.initiate('a')).unwrap();

    const mutation = store.dispatch(taskApi.endpoints.setTaskCompleted.initiate({ id: 'a', completed: true }));
    const cachedTask = () => taskApi.endpoints.getTasks.select(undefined)(store.getState()).data?.pages[0]?.items[0];
    const cachedDetail = () => taskApi.endpoints.getTask.select('a')(store.getState()).data;
    await waitFor(() => expect(cachedTask()?.completedAt).not.toBeNull());
    expect(cachedDetail()?.completedAt).not.toBeNull();
    expect(cachedTask()?.version).toBe(1);

    serverUpdated = true;
    resolveMutation(Response.json(taskDto('a', serverCompletedAt, 2)));
    await mutation.unwrap();
    await waitFor(() => expect(cachedTask()?.version).toBe(2));
    expect(cachedTask()?.completedAt).toBe(serverCompletedAt);
    await waitFor(() => expect(taskApi.endpoints.getTasks.select(undefined)(store.getState()).data?.pages[0]?.completedTotal).toBe(1));
    expect(cachedTask()?.version).toBe(2);
    expect(cachedDetail()?.completedAt).toBe(serverCompletedAt);
    expect(cachedDetail()?.version).toBe(2);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
  });

  it('shows an incomplete task immediately when completion is removed', async () => {
    stubRelativeRequest();
    let resolveMutation!: (response: Response) => void;
    const pendingMutation = new Promise<Response>((resolve) => {
      resolveMutation = resolve;
    });
    let serverUpdated = false;
    vi.stubGlobal('fetch', vi.fn((request: Request) => {
      if (request.method === 'PATCH') {
        return pendingMutation;
      }
      return Promise.resolve(Response.json({
        items: [taskDto('a', serverUpdated ? null : '2026-09-25T12:30:00Z', serverUpdated ? 3 : 2)],
        next_cursor: null,
        total: 1,
        completed_total: serverUpdated ? 0 : 1,
      }));
    }));
    const store = makeStore();
    await store.dispatch(taskApi.endpoints.getTasks.initiate(undefined)).unwrap();

    const mutation = store.dispatch(taskApi.endpoints.setTaskCompleted.initiate({ id: 'a', completed: false }));
    const cachedTask = () => taskApi.endpoints.getTasks.select(undefined)(store.getState()).data?.pages[0]?.items[0];
    await waitFor(() => expect(cachedTask()?.completedAt).toBeNull());

    serverUpdated = true;
    resolveMutation(Response.json(taskDto('a', null, 3)));
    await mutation.unwrap();
    await waitFor(() => expect(cachedTask()?.version).toBe(3));
    expect(cachedTask()?.completedAt).toBeNull();
  });

  it('rolls back a lost response and then reads the committed state', async () => {
    stubRelativeRequest();
    const serverCompletedAt = '2026-09-25T12:45:00Z';
    let rejectMutation!: (error: Error) => void;
    let resolveRefresh!: (response: Response) => void;
    const pendingMutation = new Promise<Response>((_resolve, reject) => {
      rejectMutation = reject;
    });
    const pendingRefresh = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });
    let getRequests = 0;
    vi.stubGlobal('fetch', vi.fn((request: Request) => {
      if (request.method === 'PATCH') {
        return pendingMutation;
      }
      getRequests += 1;
      return getRequests === 1
        ? Promise.resolve(Response.json({ items: [taskDto('a')], next_cursor: null, total: 1, completed_total: 0 }))
        : pendingRefresh;
    }));
    const store = makeStore();
    await store.dispatch(taskApi.endpoints.getTasks.initiate(undefined)).unwrap();

    const mutation = store.dispatch(taskApi.endpoints.setTaskCompleted.initiate({ id: 'a', completed: true }));
    const cachedTask = () => taskApi.endpoints.getTasks.select(undefined)(store.getState()).data?.pages[0]?.items[0];
    await waitFor(() => expect(cachedTask()?.completedAt).not.toBeNull());

    rejectMutation(new Error('response lost'));
    await expect(mutation.unwrap()).rejects.toBeDefined();
    await waitFor(() => expect(getRequests).toBe(2));
    expect(cachedTask()?.completedAt).toBeNull();

    resolveRefresh(Response.json({
      items: [taskDto('a', serverCompletedAt, 2)], next_cursor: null, total: 1, completed_total: 1,
    }));
    await waitFor(() => expect(cachedTask()?.completedAt).toBe(serverCompletedAt));
    expect(cachedTask()?.version).toBe(2);
  });

  it('does not show an error when the Inbox confirms a lost response succeeded', async () => {
    stubRelativeRequest();
    const serverCompletedAt = '2026-09-25T13:00:00Z';
    let getRequests = 0;
    vi.stubGlobal('fetch', vi.fn((request: Request) => {
      if (request.method === 'PATCH') {
        return Promise.reject(new Error('response lost'));
      }
      getRequests += 1;
      return Promise.resolve(Response.json({
        items: [taskDto('a', getRequests > 1 ? serverCompletedAt : null, getRequests > 1 ? 2 : 1)],
        next_cursor: null,
        total: 1,
        completed_total: getRequests > 1 ? 1 : 0,
      }));
    }));
    const store = makeStore();
    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider store={store}>
        <NotificationProvider>{children}</NotificationProvider>
      </Provider>
    );
    const { result } = renderHook(() => useInboxTasks(), { wrapper });
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));

    let confirmed!: boolean;
    await act(async () => {
      confirmed = await result.current.onToggleCompleted(result.current.tasks[0]!);
    });
    expect(confirmed).toBe(true);
    expect(result.current.actionErrorMessage).toBeNull();
    await waitFor(() => expect(result.current.tasks[0]?.completedAt).toBe(serverCompletedAt));
    expect(getRequests).toBe(2);
  });
});
