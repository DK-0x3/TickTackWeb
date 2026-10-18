import { useEffect, useState } from 'react';

import type { Task, TaskScheduleInput } from '@/entities/task';

import { TaskItem } from './TaskItem';
import styles from './TaskListWidget.module.scss';

interface TaskListProps {
  tasks: readonly Task[];
  serverToday?: string;
  updatingTaskIds: ReadonlySet<string>;
  onDeleteTask?: (task: Task) => void;
  onSetSchedule?: (task: Task, schedule: TaskScheduleInput) => Promise<boolean>;
  onToggleCompleted: (task: Task) => void;
}

export function TaskList({
  tasks,
  serverToday,
  updatingTaskIds,
  onDeleteTask,
  onSetSchedule,
  onToggleCompleted,
}: TaskListProps) {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    if (serverToday) return;
    let timer: number;

    const scheduleNextDay = () => {
      const now = new Date();
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = window.setTimeout(() => {
        setToday(new Date());
        scheduleNextDay();
      }, nextDay.getTime() - now.getTime());
    };

    scheduleNextDay();
    return () => window.clearTimeout(timer);
  }, [serverToday]);

  const displayToday = serverToday ? new Date(`${serverToday}T00:00:00`) : today;

  return (
    <ul className={styles.taskList}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          today={displayToday}
          isUpdating={updatingTaskIds.has(task.id)}
          onToggleCompleted={onToggleCompleted}
          {...(onDeleteTask ? { onDeleteTask } : {})}
          {...(onSetSchedule ? { onSetSchedule } : {})}
        />
      ))}
    </ul>
  );
}
