import type { Task } from '@/entities/task';

export type TaskViewSection = 'overdue' | 'today' | 'tomorrow' | 'next_week' | 'next' | 'completed' | 'all';

export type TaskViewSortField = 'title' | 'due_at' | 'created_at' | 'updated_at' | 'priority';

export type TaskViewSortDirection = 'asc' | 'desc';

export interface TaskView {
  id: string;
  listId: string;
  section: TaskViewSection;
  position: number;
  sortField: TaskViewSortField;
  sortDirection: TaskViewSortDirection;
  showCompleted: boolean;
  version: number;
}

export interface InboxViews {
  listId: string;
  views: TaskView[];
}

export interface TaskViewTasksPage {
  items: Task[];
  nextCursor: string | null;
  total: number;
  completedTotal: number;
  visibleTotal: number;
  viewVersion: number;
  today: string;
  nextRefreshAt: string;
}

export interface GetViewTasksInput {
  viewId: string;
  version: number;
  refreshGeneration?: number;
}

export interface UpdateViewSettingsInput {
  viewId: string;
  sortField: TaskViewSortField;
  sortDirection: TaskViewSortDirection;
  showCompleted: boolean;
  expectedVersion: number;
}
