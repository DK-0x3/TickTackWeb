import type { Task, TaskDto } from '@/entities/task';

export const mapTask = (task: TaskDto): Task => ({
  id: task.id,
  userId: task.user_id,
  title: task.title,
  description: task.description,
  priority: task.priority,
  dueDate: task.due_date,
  dueTime: task.due_time,
  completedAt: task.completed_at,
  createdAt: task.created_at,
  updatedAt: task.updated_at,
  version: task.version,
});
