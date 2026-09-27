import { baseApi } from '@/shared/api';

import type {
  CreateTaskInput,
  SetTaskCompletedInput,
  Task,
  TaskPriority,
} from '@/entities/task';

interface TaskDto {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

interface TaskPageDto {
  items: TaskDto[];
  next_cursor: string | null;
  total: number;
  completed_total: number;
}

interface TaskPage {
  items: Task[];
  nextCursor: string | null;
  total: number;
  completedTotal: number;
}

const mapTask = (task: TaskDto): Task => ({
  id: task.id,
  userId: task.user_id,
  title: task.title,
  description: task.description,
  priority: task.priority,
  completedAt: task.completed_at,
  createdAt: task.created_at,
  updatedAt: task.updated_at,
  version: task.version,
});

const updateTaskInPages = (
  pages: TaskPage[],
  taskId: string,
  update: (task: Task) => void,
) => {
  for (const page of pages) {
    for (const task of page.items) {
      if (task.id === taskId) {
        update(task);
      }
    }
  }
};

export const taskApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getTasks: build.infiniteQuery<TaskPage, void, string | null>({
      infiniteQueryOptions: {
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
      query: ({ pageParam }) => ({
        url: '/tasks',
        params: {
          limit: 20,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
      }),
      transformResponse: (response: TaskPageDto) => ({
        items: response.items.map(mapTask),
        nextCursor: response.next_cursor,
        total: response.total,
        completedTotal: response.completed_total,
      }),
      providesTags: (result) => [
        { type: 'Task', id: 'LIST' },
        ...(result?.pages.flatMap(({ items }) =>
          items.map(({ id }) => ({ type: 'Task' as const, id })),
        ) ?? []),
      ],
    }),
    getTask: build.query<Task, string>({
      query: (id) => `/tasks/${id}`,
      transformResponse: (response: TaskDto) => mapTask(response),
      providesTags: (_result, _error, id) => [{ type: 'Task', id }],
    }),
    createTask: build.mutation<Task, CreateTaskInput>({
      query: (body) => ({
        url: '/tasks',
        method: 'POST',
        body,
      }),
      transformResponse: (response: TaskDto) => mapTask(response),
      invalidatesTags: [{ type: 'Task', id: 'LIST' }],
    }),
    setTaskCompleted: build.mutation<Task, SetTaskCompletedInput>({
      query: ({ id, completed }) => ({
        url: `/tasks/${id}/completion`,
        method: 'PATCH',
        body: { completed },
      }),
      transformResponse: (response: TaskDto) => mapTask(response),
      async onQueryStarted({ id, completed }, { dispatch, queryFulfilled }) {
        const completedAt = completed ? new Date().toISOString() : null;
        const listPatch = dispatch(taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
          updateTaskInPages(draft.pages, id, (task) => {
            task.completedAt = completedAt;
          });
        }));
        const detailPatch = dispatch(taskApi.util.updateQueryData('getTask', id, (draft) => {
          draft.completedAt = completedAt;
        }));

        try {
          const { data: savedTask } = await queryFulfilled;
          dispatch(taskApi.util.updateQueryData('getTasks', undefined, (draft) => {
            updateTaskInPages(draft.pages, id, (task) => {
              Object.assign(task, savedTask);
            });
          }));
          dispatch(taskApi.util.updateQueryData('getTask', id, (draft) => {
            Object.assign(draft, savedTask);
          }));
          dispatch(taskApi.util.invalidateTags([{ type: 'Task', id: 'LIST' }]));
        } catch {
          listPatch.undo();
          detailPatch.undo();
          dispatch(taskApi.util.invalidateTags([
            { type: 'Task', id },
            { type: 'Task', id: 'LIST' },
          ]));
        }
      },
    }),
    deleteTask: build.mutation<void, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
    restoreTask: build.mutation<Task, string>({
      query: (id) => ({
        url: `/tasks/${id}/restore`,
        method: 'POST',
      }),
      transformResponse: (response: TaskDto) => mapTask(response),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Task', id },
        { type: 'Task', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useCreateTaskMutation,
  useGetTaskQuery,
  useLazyGetTaskQuery,
  useGetTasksInfiniteQuery,
  useSetTaskCompletedMutation,
  useDeleteTaskMutation,
  useRestoreTaskMutation,
} = taskApi;
