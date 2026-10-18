import { useId, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as Select from '@radix-ui/react-select';
import { useTranslation } from 'react-i18next';

import type { TaskViewDto, TaskViewSortDirection, TaskViewSortField } from '@/entities/task-view';
import { CheckIcon, EllipsisIcon } from '@/shared/ui/icon';
import { Checkbox } from '@/shared/ui/checkbox';

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
                  <SettingsSelect
                    id={fieldId}
                    value={controller.draft.sortField}
                    disabled={!controller.isReady || controller.isSaving}
                    options={sortFields.map((value) => ({ value, label: t(`tasks.viewSettings.fields.${value}`) }))}
                    onChange={controller.setSortField}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={directionId}>{t('tasks.viewSettings.sortDirection')}</label>
                  <SettingsSelect
                    id={directionId}
                    value={controller.draft.sortDirection}
                    disabled={!controller.isReady || controller.isSaving}
                    options={sortDirections.map((value) => ({ value, label: t(`tasks.viewSettings.directions.${value}`) }))}
                    onChange={controller.setSortDirection}
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

interface SettingsSelectProps<Value extends string> {
  id: string;
  value: Value;
  disabled: boolean;
  options: readonly { value: Value; label: string }[];
  onChange: (value: Value) => void;
}

function SettingsSelect<Value extends string>({ id, value, disabled, options, onChange }: SettingsSelectProps<Value>) {
  return (
    <Select.Root
      value={value}
      disabled={disabled}
      onValueChange={(nextValue) => {
        const option = options.find((item) => item.value === nextValue);
        if (option) onChange(option.value);
      }}
    >
      <Select.Trigger className={styles.selectTrigger} id={id} type="button">
        <Select.Value />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className={styles.selectContent} position="popper" sideOffset={4} collisionPadding={12}>
          <Select.Viewport className={styles.selectViewport}>
            {options.map((option) => (
              <Select.Item className={styles.option} key={option.value} value={option.value}>
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className={styles.indicator}><CheckIcon /></Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
