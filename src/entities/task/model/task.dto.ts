import type { TaskPriority } from '@/entities/task';

export interface TaskDto {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface TaskPageDto {
  items: TaskDto[];
  next_cursor: string | null;
  total: number;
  completed_total: number;
}
