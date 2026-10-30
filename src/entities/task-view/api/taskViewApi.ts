import { baseApi, normalizeApiError } from '@/shared/api';

import type { GetViewTasksInput, SetViewCollapsedInput, TaskViewTasksPage, UpdateViewSettingsInput } from '../model/taskView.types';
import type { TaskViewDto, TaskViewTasksPageDto } from '../model/taskView.dto';
import { mapTask } from '@/entities/task';
import { InboxViewsDtoSchema, ViewCollapsedResponseSchema } from '../model/taskView.schema';
import { type InboxViewsCache, mergeInboxViews } from './inboxViewsCache';

export const taskViewApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    setViewCollapsed: build.mutation<{ is_collapsed: boolean }, SetViewCollapsedInput>({
      query: ({ viewId, isCollapsed }) => ({
        url: `/task-views/${viewId}/collapse`,
        method: 'PATCH',
        body: { is_collapsed: isCollapsed },
        timeout: 10_000,
      }),
      responseSchema: ViewCollapsedResponseSchema,
      async onQueryStarted({ viewId, isCollapsed }, { dispatch, queryFulfilled, requestId }) {
        let previousValue: boolean | undefined;
        dispatch(taskViewApi.util.updateQueryData('getInboxViews', undefined, (draft) => {
          const view = draft.views.find(({ id }) => id === viewId);
          if (!view) return;
          previousValue = view.is_collapsed;
          draft.collapseWrites ??= {};
          draft.collapseWrites[viewId] = { requestId, value: isCollapsed, pending: true };
          view.is_collapsed = isCollapsed;
        }));
        try {
          const { data } = await queryFulfilled;
          dispatch(taskViewApi.util.updateQueryData('getInboxViews', undefined, (draft) => {
            const write = draft.collapseWrites?.[viewId];
            if (write?.requestId !== requestId) return;
            write.value = data.is_collapsed;
            write.pending = false;
            const view = draft.views.find(({ id }) => id === viewId);
            if (view) view.is_collapsed = data.is_collapsed;
          }));
        } catch (failure) {
          const error = typeof failure === 'object' && failure !== null && 'error' in failure
            ? failure.error
            : failure;
          const rejected = normalizeApiError(error).kind === 'client';
          dispatch(taskViewApi.util.updateQueryData('getInboxViews', undefined, (draft) => {
            const write = draft.collapseWrites?.[viewId];
            if (write?.requestId !== requestId) return;
            if (rejected) {
              const view = draft.views.find(({ id }) => id === viewId);
              if (previousValue !== undefined) {
                if (view) view.is_collapsed = previousValue;
                write.value = previousValue;
              }
            }
            write.pending = false;
          }));
        }
      },
      invalidatesTags: (_result, error) => error && normalizeApiError(error).status === 404 ? ['TaskView'] : [],
    }),
    getInboxViews: build.query<InboxViewsCache, void>({
      query: () => '/inbox/views',
      responseSchema: InboxViewsDtoSchema,
      onQueryStarted(_arg, { dispatch, requestId }) {
        dispatch(taskViewApi.util.updateQueryData('getInboxViews', undefined, (draft) => {
          draft.collapseRead = {
            requestId,
            writes: Object.fromEntries(Object.entries(draft.collapseWrites ?? {}).map(([id, write]) => [id, { ...write }])),
          };
        }));
      },
      merge: (current, incoming, { requestId }) => mergeInboxViews(current, incoming, requestId),
      providesTags: ['TaskView'],
    }),
    getViewTasksPage: build.infiniteQuery<TaskViewTasksPage, GetViewTasksInput, string | null>({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) =>
          lastPage.nextCursor ?? undefined,
      },
      query: ({ queryArg, pageParam }) => ({
        url: `/task-views/${queryArg.viewId}/tasks`,
        params: {
          limit: 20,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      }),
      transformResponse: (response: TaskViewTasksPageDto): TaskViewTasksPage => ({
        items: response.items.map((task) => mapTask(task)),
        nextCursor: response.next_cursor,
        total: response.total,
        completedTotal: response.completed_total,
        visibleTotal: response.visible_total,
        viewVersion: response.view_version,
        today: response.today,
        nextRefreshAt: response.next_refresh_at,
      }),
      providesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    updateViewSettings: build.mutation<TaskViewDto, UpdateViewSettingsInput>({
      query: ({ viewId, sortField, sortDirection, expectedVersion, showCompleted, showPriority }) => ({
        url: `/task-views/${viewId}/settings`,
        method: 'PATCH',
        body: {
          sort_field: sortField,
          sort_direction: sortDirection,
          expected_version: expectedVersion,
          show_completed: showCompleted,
          show_priority: showPriority,
        },
      }),
      invalidatesTags: ['TaskView'],
    }),
  }),
});

export const {
  useSetViewCollapsedMutation,
  useGetInboxViewsQuery,
  useLazyGetInboxViewsQuery,
  useGetViewTasksPageInfiniteQuery,
  useUpdateViewSettingsMutation,
} = taskViewApi;
