import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { CheckIcon, XIcon } from '@/shared/ui/icon';

import styles from './CreateTaskForm.module.scss';

interface CreateTaskFormProps {
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (title: string) => Promise<boolean>;
}

export function CreateTaskForm({
  errorMessage,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: CreateTaskFormProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const normalizedTitle = title.trim();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedTitle || isSubmitting) {
      return;
    }

    const isCreated = await onSubmit(normalizedTitle);

    if (isCreated) {
      setTitle('');
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
