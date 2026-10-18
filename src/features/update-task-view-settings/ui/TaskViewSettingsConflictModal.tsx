import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '@/shared/ui/modal';

import type { TaskViewSettingsDraft } from '../model/useTaskViewSettings';
import styles from './TaskViewSettingsConflictModal.module.scss';

export interface TaskViewSettingsConflictModalProps {
  open: boolean;
  draft: TaskViewSettingsDraft;
  serverSettings: TaskViewSettingsDraft;
  isSaving: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  onUseServerSettings: () => void;
  onApplyMyChoice: () => void;
}

export function TaskViewSettingsConflictModal({
  open,
  draft,
  serverSettings,
  isSaving,
  returnFocusRef,
  onClose,
  onUseServerSettings,
  onApplyMyChoice,
}: TaskViewSettingsConflictModalProps) {
  const { t } = useTranslation();
  const rows = [
    {
      key: 'sortField',
      label: t('tasks.viewSettings.sortField'),
      draftValue: t(`tasks.viewSettings.fields.${draft.sortField}`),
      serverValue: t(`tasks.viewSettings.fields.${serverSettings.sortField}`),
      differs: draft.sortField !== serverSettings.sortField,
    },
    {
      key: 'sortDirection',
      label: t('tasks.viewSettings.sortDirection'),
      draftValue: t(`tasks.viewSettings.directions.${draft.sortDirection}`),
      serverValue: t(`tasks.viewSettings.directions.${serverSettings.sortDirection}`),
      differs: draft.sortDirection !== serverSettings.sortDirection,
    },
    {
      key: 'showCompleted',
      label: t('tasks.viewSettings.showCompleted'),
      draftValue: t(draft.showCompleted ? 'tasks.viewSettings.enabled' : 'tasks.viewSettings.disabled'),
      serverValue: t(serverSettings.showCompleted ? 'tasks.viewSettings.enabled' : 'tasks.viewSettings.disabled'),
      differs: draft.showCompleted !== serverSettings.showCompleted,
    },
  ];

  return (
    <Modal
      open={open}
      title={t('tasks.viewSettings.conflictDialog.title')}
      description={t('tasks.viewSettings.conflictDialog.description')}
      closeLabel={t('tasks.viewSettings.conflictDialog.close')}
      isBusy={isSaving}
      {...(returnFocusRef ? { returnFocusRef } : {})}
      onClose={onClose}
      footer={(
        <>
          <button className={styles.useServer} type="button" disabled={isSaving} onClick={onUseServerSettings}>
            {t('tasks.viewSettings.conflictDialog.useServer')}
          </button>
          <button className={styles.applyChoice} type="button" disabled={isSaving} onClick={onApplyMyChoice}>
            {t(isSaving ? 'tasks.viewSettings.saving' : 'tasks.viewSettings.conflictDialog.applyChoice')}
          </button>
        </>
      )}
    >
      <table className={styles.comparison}>
        <thead>
          <tr>
            <th scope="col">{t('tasks.viewSettings.conflictDialog.parameter')}</th>
            <th scope="col">{t('tasks.viewSettings.conflictDialog.yourChoice')}</th>
            <th scope="col">{t('tasks.viewSettings.conflictDialog.serverChoice')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} data-different={row.differs}>
              <th scope="row">
                {row.label}
                {row.differs ? <span className={styles.difference}>{t('tasks.viewSettings.conflictDialog.different')}</span> : null}
              </th>
              <td>{row.draftValue}</td>
              <td>{row.serverValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
