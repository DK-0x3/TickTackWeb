import { z } from 'zod';
import type {
  InboxViewsDto,
  TaskViewDto,
  TaskViewSection,
  TaskViewSortDirection,
  TaskViewSortField,
} from '@/entities/task-view';

export const TaskViewSectionSchema = z.enum([
  'overdue',
  'today',
  'tomorrow',
  'next_week',
  'next',
  'completed',
  'all',
] satisfies TaskViewSection[]);

export const TaskViewSortFieldSchema = z.enum([
  'title', 'due_at', 'created_at', 'updated_at', 'priority',
] satisfies TaskViewSortField[]);

export const TaskViewSortDirectionSchema = z.enum([
  'asc', 'desc',
] satisfies TaskViewSortDirection[]);

export const TaskViewDtoSchema = z.object({
  id: z.uuid(),
  list_id: z.uuid(),
  section: TaskViewSectionSchema,
  position: z.number().int().nonnegative(),
  sort_field: TaskViewSortFieldSchema,
  sort_direction: TaskViewSortDirectionSchema,
  show_completed: z.boolean(),
  version: z.number().int().positive(),
}) satisfies z.ZodType<TaskViewDto>;

export const conflictErrorSchema = z.object({
  status: z.literal(409),
  data: z.object({
    error: z.object({
      code: z.literal('view_conflict'),
      message: z.string(),
    }),
    current_view: TaskViewDtoSchema,
  }),
});

export const InboxViewsDtoSchema = z.object({
  list_id: z.uuid(),
  views: z.array(TaskViewDtoSchema),
}) satisfies z.ZodType<InboxViewsDto>;
