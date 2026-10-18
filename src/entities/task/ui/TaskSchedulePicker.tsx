import { lazy, Suspense, useState, type ComponentProps, type ReactElement } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useTranslation } from 'react-i18next';

import type { TaskScheduleInput } from '../model/task.types';
import { normalizeTaskTime } from '../lib/normalizeTaskTime';

import { TaskTimeInput } from './TaskTimeInput';
import styles from './TaskSchedulePicker.module.scss';

const TaskCalendar = lazy(() => import('./TaskCalendar').then(({ TaskCalendar: component }) => ({ default: component })));

interface TaskSchedulePickerProps {
  anchorRef?: ComponentProps<typeof Popover.Anchor>['virtualRef'];
  align?: ComponentProps<typeof Popover.Content>['align'];
  sideOffset?: number;
  children?: ReactElement;
  disabled?: boolean;
  open: boolean;
  value: TaskScheduleInput;
  onApply: (schedule: TaskScheduleInput) => Promise<boolean> | boolean;
  onCloseAutoFocus?: ComponentProps<typeof Popover.Content>['onCloseAutoFocus'];
  onOpenChange: (open: boolean) => void;
}

function parseLocalDate(value: string): Date {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  return new Date(year, month - 1, day, 12);
}

function formatLocalDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TaskSchedulePicker({
  anchorRef,
  align = 'start',
  sideOffset = 8,
  children,
  disabled = false,
  open,
  value,
  onApply,
  onCloseAutoFocus,
  onOpenChange,
}: TaskSchedulePickerProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  const changeOpen = (nextOpen: boolean) => {
    if (isSaving) return;
    onOpenChange(nextOpen);
  };

  const apply = async (schedule: TaskScheduleInput) => {
    if (isSaving || disabled) return;
    setIsSaving(true);
    try {
      if (await onApply(schedule)) onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={changeOpen}>
      {anchorRef ? <Popover.Anchor virtualRef={anchorRef} /> : null}
      {children ? <Popover.Trigger asChild>{children}</Popover.Trigger> : null}
      <Popover.Portal>
        <Popover.Content
          className={styles.content}
          aria-label={t('tasks.schedule.date')}
          onCloseAutoFocus={onCloseAutoFocus}
          side="bottom"
          align={align}
          sideOffset={sideOffset}
          collisionPadding={12}
        >
          <TaskScheduleEditor
            value={value}
            disabled={disabled}
            isSaving={isSaving}
            onApply={apply}
            onCancel={() => changeOpen(false)}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface TaskScheduleEditorProps {
  disabled: boolean;
  isSaving: boolean;
  value: TaskScheduleInput;
  onApply: (schedule: TaskScheduleInput) => Promise<void>;
  onCancel: () => void;
}

function TaskScheduleEditor({
  disabled,
  isSaving,
  value,
  onApply,
  onCancel,
}: TaskScheduleEditorProps) {
  const { t, i18n } = useTranslation();
  const [draftDate, setDraftDate] = useState(value.dueDate ?? '');
  const [draftTime, setDraftTime] = useState(value.dueTime ?? '');
  const selectedDate = draftDate ? parseLocalDate(draftDate) : undefined;
  const normalizedTime = normalizeTaskTime(draftTime);

  return (
    <>
      <Suspense fallback={<div className={styles.calendarLoading} aria-busy="true" />}>
        <TaskCalendar
          language={i18n.language}
          selectedDate={selectedDate}
          onSelect={(date) => setDraftDate(formatLocalDate(date))}
        />
      </Suspense>

      <div className={styles.timeRow}>
        <TaskTimeInput
          label={t('tasks.schedule.time')}
          noTimeLabel={t('tasks.schedule.noTime')}
          errorMessage={t('tasks.schedule.invalidTime')}
          value={draftTime}
          disabled={!draftDate || isSaving || disabled}
          onChange={setDraftTime}
        />
      </div>

      <div className={styles.actions}>
        {value.dueDate
          ? (
              <button
                className={styles.clearDate}
                type="button"
                disabled={isSaving || disabled}
                onClick={() => { void onApply({ dueDate: null, dueTime: null }); }}
              >
                {t('tasks.schedule.clear')}
              </button>
            )
          : null}
        <button
          className={styles.cancel}
          type="button"
          disabled={isSaving}
          onClick={onCancel}
        >
          {t('tasks.schedule.cancel')}
        </button>
        <button
          className={styles.save}
          type="button"
          disabled={!draftDate || normalizedTime === null || isSaving || disabled}
          onClick={() => {
            if (normalizedTime === null) return;
            void onApply({ dueDate: draftDate, dueTime: normalizedTime || null });
          }}
        >
          {t('tasks.schedule.save')}
        </button>
      </div>
    </>
  );
}
