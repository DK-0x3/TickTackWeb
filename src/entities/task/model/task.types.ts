export type TaskPriority = 'none' | 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
}

export interface SetTaskCompletedInput {
  id: string;
  completed: boolean;
}
