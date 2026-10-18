export type TaskPriority = 'none' | 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  dueTime: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  dueTime?: string | null;
}

export interface TaskScheduleInput {
  dueDate: string | null;
  dueTime: string | null;
}

export interface SetTaskScheduleInput extends TaskScheduleInput {
  id: string;
}

export interface SetTaskCompletedInput {
  id: string;
  completed: boolean;
}
