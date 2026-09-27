import type { Task } from '@/entities/task';

import { TaskItem } from './TaskItem';
import styles from './TaskListWidget.module.scss';

interface TaskListProps {
  tasks: readonly Task[];
  updatingTaskIds: ReadonlySet<string>;
  onDeleteTask?: (task: Task) => void;
  onToggleCompleted: (task: Task) => void;
}

export function TaskList({
  tasks,
  updatingTaskIds,
  onDeleteTask,
  onToggleCompleted,
}: TaskListProps) {
  return (
    <ul className={styles.taskList}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isUpdating={updatingTaskIds.has(task.id)}
          onToggleCompleted={onToggleCompleted}
          {...(onDeleteTask ? { onDeleteTask } : {})}
        />
      ))}
    </ul>
  );
}
