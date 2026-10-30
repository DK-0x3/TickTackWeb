import type { TaskViewDto } from '@/entities/task-view';
import { TaskViewSettings } from '@/features/update-task-view-settings';

import { useTaskListViewTasks } from '../model/useTaskListViewTasks';
import { useTaskViewCollapse } from '../model/useTaskViewCollapse';
import { TaskListWidget } from './TaskListWidget';

interface TaskListViewProps {
  view: TaskViewDto;
  title: string;
  canCreateTask?: boolean;
  showProgress?: boolean;
}

export function TaskListView({
  view,
  title,
  canCreateTask = false,
  showProgress = true,
}: TaskListViewProps) {
  const { onCreateTask, ...tasks } = useTaskListViewTasks(view);
  const collapse = useTaskViewCollapse(view);

  return (
    <TaskListWidget
      {...tasks}
      {...collapse}
      title={title}
      showProgress={showProgress}
      showPriority={view.show_priority}
      settingsAction={<TaskViewSettings view={view} title={title} />}
      {...(canCreateTask ? { onCreateTask } : {})}
    />
  );
}
