import type { TaskDto } from '@/entities/task';
import type {
  TaskViewSection,
  TaskViewSortDirection,
  TaskViewSortField,
} from './taskView.types';

export interface TaskViewDto {
  id: string;
  list_id: string;
  section: TaskViewSection;
  position: number;
  sort_field: TaskViewSortField;
  sort_direction: TaskViewSortDirection;
  show_completed: boolean;
  show_priority: boolean;
  is_collapsed: boolean;
  version: number;
}

export interface InboxViewsDto {
  list_id: string;
  views: TaskViewDto[];
}

export interface TaskViewTasksPageDto {
  items: TaskDto[];
  next_cursor: string | null;
  total: number;
  completed_total: number;
  visible_total: number;
  view_version: number;
  today: string;
  next_refresh_at: string;
}
