import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatTaskDueDate, TaskSchedulePicker, type Task, type TaskScheduleInput } from '@/entities/task';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { CalendarIcon, CheckIcon, TrashIcon } from '@/shared/ui/icon';

import styles from './TaskListWidget.module.scss';

interface TaskItemProps {
  isUpdating: boolean;
  task: Task;
  today: Date;
  onDeleteTask?: (task: Task) => void;
  onSetSchedule?: (task: Task, schedule: TaskScheduleInput) => Promise<boolean>;
  onToggleCompleted: (task: Task) => void;
  showPriority: boolean;
}

export function TaskItem({
  isUpdating,
  task,
  today,
  onDeleteTask,
  onSetSchedule,
  onToggleCompleted,
  showPriority,
}: TaskItemProps) {
  const { t, i18n } = useTranslation();
  const isCompleted = task.completedAt !== null;
  const hasPriorityBadge = showPriority && task.priority !== 'none';
  const priorityDescriptionId = useId();
  const priorityDescription = !showPriority && task.priority !== 'none'
    ? t('tasks.priority.description', { priority: t(`tasks.priority.${task.priority}`) })
    : undefined;
  const hasMenuActions = Boolean(onSetSchedule ?? onDeleteTask);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const rowRef = useRef<HTMLLIElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const scheduleAnchorRef = useRef<{
    getBoundingClientRect: () => DOMRect;
    contextElement?: Element;
  } | null>(null);
  const [scheduleSource, setScheduleSource] = useState<'date' | 'menu'>('date');
  const focusReturnRef = useRef<HTMLElement | null>(null);
  const openScheduleAfterMenuClosesRef = useRef(false);
  const dateLabel = task.dueDate
    ? formatTaskDueDate(task.dueDate, i18n.language, {
        today: t('tasks.schedule.today'),
        tomorrow: t('tasks.schedule.tomorrow'),
      }, today)
    : null;
  const scheduleLabel = dateLabel ? [dateLabel, task.dueTime].filter(Boolean).join(' · ') : '';

  const row = (
    <li ref={rowRef} className={styles.taskItem} tabIndex={hasMenuActions ? 0 : undefined}>
      <button
        className={styles.checkbox}
        type="button"
        role="checkbox"
        aria-checked={isCompleted}
        aria-label={t('tasks.list.completionLabel', { title: task.title })}
        aria-describedby={priorityDescription ? priorityDescriptionId : undefined}
        title={priorityDescription}
        disabled={isUpdating}
        onClick={() => onToggleCompleted(task)}
        data-priority={!showPriority && task.priority !== 'none' ? task.priority : undefined}
      >
        {isCompleted ? <CheckIcon /> : null}
        {priorityDescription
          ? <span className={styles.visuallyHidden} id={priorityDescriptionId}>{priorityDescription}</span>
          : null}
      </button>

      <div className={styles.taskMain}>
        <span className={`${styles.taskTitle} ${isCompleted ? styles.completedTitle : ''}`}>
          {task.title}
        </span>
      </div>

      {(hasPriorityBadge || scheduleLabel)
        ? (
            <div className={styles.taskMeta}>
              {hasPriorityBadge
                ? (
                    <span className={`${styles.priority} ${styles[task.priority]}`}>
                      {t(`tasks.priority.${task.priority}`)}
                    </span>
                  )
                : null}
              {scheduleLabel && onSetSchedule
                ? (
                    <button
                      className={styles.taskDue}
                      type="button"
                      disabled={isUpdating}
                      aria-label={`${t('tasks.schedule.changeDate')}: ${task.title}`}
                      onClick={(event) => {
                        scheduleAnchorRef.current = event.currentTarget;
                        setScheduleSource('date');
                        focusReturnRef.current = event.currentTarget;
                        setIsScheduleOpen(true);
                      }}
                    >
                      {scheduleLabel}
                    </button>
                  )
                : scheduleLabel
                  ? <span className={styles.taskDue}>{scheduleLabel}</span>
                  : null}
            </div>
          )
        : null}

      {onSetSchedule
        ? (
            <TaskSchedulePicker
              anchorRef={scheduleAnchorRef}
              align={scheduleSource === 'date' ? 'end' : 'start'}
              sideOffset={scheduleSource === 'date' ? 8 : 0}
              open={isScheduleOpen}
              value={{ dueDate: task.dueDate, dueTime: task.dueTime }}
              disabled={isUpdating}
              onOpenChange={setIsScheduleOpen}
              onApply={(schedule) => onSetSchedule(task, schedule)}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                const target = focusReturnRef.current;
                if (target?.isConnected) target.focus();
                else rowRef.current?.focus();
                focusReturnRef.current = null;
              }}
            />
          )
        : null}
    </li>
  );

  if (!hasMenuActions) return row;

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger asChild disabled={isUpdating}>
        {row}
      </ContextMenuTrigger>
      <ContextMenuContent
        ref={contextMenuRef}
        aria-label={t('tasks.list.taskActions', { title: task.title })}
        onCloseAutoFocus={(event) => {
          if (!openScheduleAfterMenuClosesRef.current) return;
          event.preventDefault();
          openScheduleAfterMenuClosesRef.current = false;
          focusReturnRef.current = rowRef.current;
          setIsScheduleOpen(true);
        }}
      >
        {onSetSchedule
          ? (
              <ContextMenuItem onSelect={() => {
                const bounds = contextMenuRef.current?.getBoundingClientRect();
                if (!bounds) return;
                // The menu unmounts before the calendar opens, so preserve its origin.
                const origin = DOMRect.fromRect({ x: bounds.left, y: bounds.top, width: 0, height: 0 });
                scheduleAnchorRef.current = {
                  getBoundingClientRect: () => origin,
                  ...(rowRef.current ? { contextElement: rowRef.current } : {}),
                };
                setScheduleSource('menu');
                openScheduleAfterMenuClosesRef.current = true;
              }}
              >
                <CalendarIcon />
                {t(task.dueDate ? 'tasks.schedule.changeDate' : 'tasks.schedule.addDate')}
              </ContextMenuItem>
            )
          : null}
        {onSetSchedule && onDeleteTask ? <ContextMenuSeparator /> : null}
        {onDeleteTask
          ? (
              <ContextMenuItem tone="danger" onSelect={() => onDeleteTask(task)}>
                <TrashIcon />
                {t('tasks.delete.action')}
              </ContextMenuItem>
            )
          : null}
      </ContextMenuContent>
    </ContextMenuRoot>
  );
}
