import { baseApi } from '@/shared/api';

import type { GetViewTasksInput, TaskViewTasksPage, UpdateViewSettingsInput } from '../model/taskView.types';
import type { InboxViewsDto, TaskViewDto, TaskViewTasksPageDto } from '../model/taskView.dto';
import { mapTask } from '@/entities/task';
import { InboxViewsDtoSchema } from '@/entities/task-view/model/taskView.schema';

export const taskViewApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getInboxViews: build.query<InboxViewsDto, void>({
      query: () => '/inbox/views',
      responseSchema: InboxViewsDtoSchema,
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
      query: ({ viewId, sortField, sortDirection, expectedVersion, showCompleted }) => ({
        url: `/task-views/${viewId}/settings`,
        method: 'PATCH',
        body: {
          sort_field: sortField,
          sort_direction: sortDirection,
          expected_version: expectedVersion,
          show_completed: showCompleted,
        },
      }),
      invalidatesTags: ['TaskView'],
    }),
  }),
});

export const {
  useGetInboxViewsQuery,
  useLazyGetInboxViewsQuery,
  useGetViewTasksPageInfiniteQuery,
  useUpdateViewSettingsMutation,
} = taskViewApi;
