import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { formatTaskDate, TaskSchedulePicker, type CreateTaskInput } from '@/entities/task';
import { CalendarIcon, CheckIcon, XIcon } from '@/shared/ui/icon';

import styles from './CreateTaskForm.module.scss';

interface CreateTaskFormProps {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<boolean>;
}

export function CreateTaskForm({
  errorMessage,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: CreateTaskFormProps) {
  const { t, i18n } = useTranslation();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const normalizedTitle = title.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedTitle || isSubmitting) {
      return;
    }

    const isCreated = await onSubmit({
      title: normalizedTitle,
      dueDate: dueDate || null,
      dueTime: dueDate && dueTime ? dueTime : null,
    });

    if (isCreated) {
      setTitle('');
      setDueDate('');
      setDueTime('');
      onCancel();
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <label className={styles.label} htmlFor="new-task-title">
        {t('tasks.create.label')}
      </label>

      <div className={styles.controls}>
        <input
          autoFocus
          className={styles.input}
          id="new-task-title"
          maxLength={500}
          name="title"
          placeholder={t('tasks.create.placeholder')}
          type="text"
          value={title}
          disabled={isSubmitting}
          aria-describedby={errorMessage ? 'new-task-error' : undefined}
          aria-invalid={Boolean(errorMessage)}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          }}
        />

        <button
          className={styles.submitButton}
          type="submit"
          disabled={!normalizedTitle || isSubmitting}
          aria-label={t('tasks.create.submit')}
          title={t('tasks.create.submit')}
        >
          <CheckIcon />
        </button>

        <button
          className={styles.cancelButton}
          type="button"
          disabled={isSubmitting}
          aria-label={t('tasks.create.cancel')}
          title={t('tasks.create.cancel')}
          onClick={onCancel}
        >
          <XIcon />
        </button>
      </div>

      <TaskSchedulePicker
        open={isScheduleOpen}
        value={{ dueDate: dueDate || null, dueTime: dueTime || null }}
        disabled={isSubmitting}
        onOpenChange={setIsScheduleOpen}
        onApply={(schedule) => {
          setDueDate(schedule.dueDate ?? '');
          setDueTime(schedule.dueTime ?? '');
          return true;
        }}
      >
        <button
          className={styles.scheduleToggle}
          type="button"
          aria-label={t(dueDate ? 'tasks.schedule.changeDate' : 'tasks.schedule.addDate')}
          disabled={isSubmitting}
        >
          <CalendarIcon />
          {dueDate ? formatTaskDate(dueDate, i18n.language) : t('tasks.schedule.addDate')}
          {dueTime ? ` · ${dueTime}` : null}
        </button>
      </TaskSchedulePicker>

      {errorMessage
        ? (
            <p className={styles.error} id="new-task-error" role="alert">
              {errorMessage}
            </p>
          )
        : null}
    </form>
  );
}
