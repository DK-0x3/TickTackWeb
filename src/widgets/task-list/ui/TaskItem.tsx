import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Task } from '@/entities/task';
import { CheckIcon, EllipsisIcon } from '@/shared/ui/icon';

import styles from './TaskListWidget.module.scss';

interface TaskItemProps {
  isUpdating: boolean;
  task: Task;
  onDeleteTask?: (task: Task) => void;
  onToggleCompleted: (task: Task) => void;
}

export function TaskItem({
  isUpdating,
  task,
  onDeleteTask,
  onToggleCompleted,
}: TaskItemProps) {
  const { t } = useTranslation();
  const isCompleted = task.completedAt !== null;
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDetailsElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActionsOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !actionsRef.current?.contains(event.target)) {
        if (actionsRef.current) actionsRef.current.open = false;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !actionsRef.current?.open) return;

      event.preventDefault();
      const focusIsInside = actionsRef.current.contains(document.activeElement);
      actionsRef.current.open = false;
      if (focusIsInside) triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActionsOpen]);

  return (
    <li className={styles.taskItem}>
      <button
        className={styles.checkbox}
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        aria-label={t('tasks.list.completionLabel', { title: task.title })}
        disabled={isUpdating}
        onClick={() => onToggleCompleted(task)}
      >
        {isCompleted ? <CheckIcon /> : null}
      </button>

      <span
        className={`${styles.taskTitle} ${isCompleted ? styles.completedTitle : ''}`}
      >
        {task.title}
      </span>

      {task.priority !== 'none'
        ? (
            <span
              className={`${styles.priority} ${styles[task.priority]}`}
            >
              {t(`tasks.priority.${task.priority}`)}
            </span>
          )
        : null}

      {onDeleteTask
        ? (
            <details
              ref={actionsRef}
              className={styles.taskActions}
              onToggle={(event) => setIsActionsOpen(event.currentTarget.open)}
            >
              <summary
                ref={triggerRef}
                className={styles.iconButton}
                aria-label={t('tasks.list.taskActions', { title: task.title })}
                title={t('tasks.list.taskActions', { title: task.title })}
              >
                <EllipsisIcon />
              </summary>
              <div className={styles.taskActionsMenu}>
                <button
                  className={styles.deleteButton}
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onDeleteTask(task)}
                >
                  {t('tasks.delete.action')}
                </button>
              </div>
            </details>
          )
        : null}
    </li>
  );
}
