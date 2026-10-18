import type { TaskViewDto } from '@/entities/task-view';
import { conflictErrorSchema } from '@/entities/task-view/model/taskView.schema';

export function getTaskViewConflict(error: unknown, expectedViewId: string): TaskViewDto | null {
  const result = conflictErrorSchema.safeParse(error);
  if (!result.success) {
    return null;
  }

  const view = result.data.data.current_view;
  return view.id === expectedViewId ? view : null;
}
