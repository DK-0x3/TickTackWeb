import { useId, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useTranslation } from 'react-i18next';

import type { TaskViewDto, TaskViewSortDirection, TaskViewSortField } from '@/entities/task-view';
import { EllipsisIcon } from '@/shared/ui/icon';
import { Checkbox } from '@/shared/ui/checkbox';
import { Select } from '@/shared/ui/select';

import { useTaskViewSettings } from '../model/useTaskViewSettings';
import styles from './TaskViewSettings.module.scss';
import { TaskViewSettingsConflictModal } from './TaskViewSettingsConflictModal';

const sortFields: readonly TaskViewSortField[] = ['title', 'due_at', 'created_at', 'updated_at', 'priority'];
const sortDirections: readonly TaskViewSortDirection[] = ['asc', 'desc'];

interface TaskViewSettingsProps {
  view: TaskViewDto;
  title: string;
}

export function TaskViewSettings({ view, title }: TaskViewSettingsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const fieldId = useId();
  const directionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const controller = useTaskViewSettings(view);
  const canShowCompleted = ['today', 'tomorrow', 'next_week', 'next'].includes(view.section);

  const changeOpen = (nextOpen: boolean) => {
    if (controller.isSaving) return;
    if (nextOpen) controller.reset();
    setOpen(nextOpen);
  };

  const apply = async () => {
    if (!controller.isReady || !controller.isDirty || controller.isSaving) return;
    if (await controller.save()) setOpen(false);
  };

  return (
    <>
      <Popover.Root open={open} onOpenChange={changeOpen}>
        <Popover.Trigger asChild>
          <button
            className={styles.trigger}
            type="button"
            aria-label={t('tasks.viewSettings.open', { title })}
            title={t('tasks.list.settings')}
            disabled={controller.isSaving}
          >
            <EllipsisIcon />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            ref={panelRef}
            className={styles.panel}
            side="bottom"
            align="end"
            sideOffset={8}
            collisionPadding={12}
            aria-label={t('tasks.viewSettings.open', { title })}
            onInteractOutside={(event) => { if (controller.conflictView) event.preventDefault(); }}
            onEscapeKeyDown={(event) => { if (controller.conflictView) event.preventDefault(); }}
          >
            <form onSubmit={(event) => { event.preventDefault(); void apply(); }}>
              <div className={styles.heading}>
                <h3 className={styles.title}>{t('tasks.viewSettings.title')}</h3>
                <p className={styles.subtitle}>{title}</p>
              </div>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={fieldId}>{t('tasks.viewSettings.sortField')}</label>
                  <Select
                    id={fieldId}
                    value={controller.draft.sortField}
                    disabled={!controller.isReady || controller.isSaving}
                    options={sortFields.map((value) => ({ value, label: t(`tasks.viewSettings.fields.${value}`) }))}
                    onValueChange={controller.setSortField}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={directionId}>{t('tasks.viewSettings.sortDirection')}</label>
                  <Select
                    id={directionId}
                    value={controller.draft.sortDirection}
                    disabled={!controller.isReady || controller.isSaving}
                    options={sortDirections.map((value) => ({ value, label: t(`tasks.viewSettings.directions.${value}`) }))}
                    onValueChange={controller.setSortDirection}
                  />
                </div>
                {canShowCompleted && (
                  <Checkbox
                    className={styles.checkboxField}
                    label={t('tasks.viewSettings.showCompleted')}
                    description={t('tasks.viewSettings.showCompletedDescription')}
                    checked={controller.draft.showCompleted}
                    disabled={!controller.isReady || controller.isSaving}
                    onCheckedChange={controller.setShowCompleted}
                  />
                )}
                <Checkbox
                  className={styles.checkboxField}
                  label={t('tasks.viewSettings.showPriority')}
                  description={t('tasks.viewSettings.showPriorityDescription')}
                  checked={controller.draft.showPriority}
                  disabled={!controller.isReady || controller.isSaving}
                  onCheckedChange={controller.setShowPriority}
                />
              </div>
              {controller.errorMessage ? <p className={styles.error} role="alert">{controller.errorMessage}</p> : null}
              <div className={styles.actions}>
                <button className={styles.cancel} type="button" disabled={controller.isSaving} onClick={() => changeOpen(false)}>
                  {t('tasks.viewSettings.cancel')}
                </button>
                <button className={styles.apply} type="submit" disabled={!controller.isReady || !controller.isDirty || controller.isSaving}>
                  {t(controller.isSaving ? 'tasks.viewSettings.saving' : 'tasks.viewSettings.apply')}
                </button>
              </div>
            </form>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      {
        controller.conflictView && (
          <TaskViewSettingsConflictModal
            open={!!controller.conflictView}
            draft={controller.draft}
            serverSettings={{
              sortField: controller.conflictView.sort_field,
              sortDirection: controller.conflictView.sort_direction,
              showCompleted: controller.conflictView.show_completed,
              showPriority: controller.conflictView.show_priority,
            }}
            isSaving={controller.isSaving}
            returnFocusRef={panelRef}
            onClose={controller.clearConflict}
            onUseServerSettings={controller.applyServerSettingsForConflict}
            onApplyMyChoice={controller.applyMySettingsForConflict}
          />
        )
      }
    </>
  );
}
