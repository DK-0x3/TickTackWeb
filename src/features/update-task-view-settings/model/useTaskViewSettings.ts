import {
  getTaskViewConflict,
  type TaskViewDto,
  type TaskViewSortDirection,
  type TaskViewSortField,
  useUpdateViewSettingsMutation,
} from '@/entities/task-view';
import { useRef, useState } from 'react';
import { normalizeApiError, useApiErrorMessage } from '@/shared/api';
import { useTranslation } from 'react-i18next';

export interface TaskViewSettingsDraft {
  sortField: TaskViewSortField;
  sortDirection: TaskViewSortDirection;
  showCompleted: boolean;
  showPriority: boolean;
}

type InitialSettings = TaskViewSettingsDraft & {
  version: number;
};

export interface TaskViewSettingsController {
  draft: TaskViewSettingsDraft;
  conflictView: TaskViewDto | null;
  isReady: boolean;
  isDirty: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  setSortField: (value: TaskViewSortField) => void;
  setSortDirection: (value: TaskViewSortDirection) => void;
  setShowCompleted: (value: boolean) => void;
  setShowPriority: (value: boolean) => void;
  reset: () => void;
  save: () => Promise<boolean>;
  clearConflict: VoidFunction;
  applyServerSettingsForConflict: () => void;
  applyMySettingsForConflict: () => void;
}

export function useTaskViewSettings(
  view: TaskViewDto,
): TaskViewSettingsController {
  const { t } = useTranslation();

  const [draft, setDraft] = useState<TaskViewSettingsDraft>({
    sortField: view.sort_field,
    sortDirection: view.sort_direction,
    showCompleted: view.show_completed,
    showPriority: view.show_priority,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initialSettings, setInitialSettings] = useState<InitialSettings>({
    sortField: view.sort_field,
    sortDirection: view.sort_direction,
    showCompleted: view.show_completed,
    showPriority: view.show_priority,
    version: view.version,
  });
  const [conflictView, setConflictView] = useState<TaskViewDto | null>(null);
  const isSavingInFlight = useRef(false);

  const getApiErrorMessage = useApiErrorMessage();
  const [updateViewSettings] = useUpdateViewSettingsMutation();

  const reset = () => {
    const settings = {
      sortField: view.sort_field,
      sortDirection: view.sort_direction,
      showCompleted: view.show_completed,
      showPriority: view.show_priority,
      version: view.version,
    };

    setInitialSettings(settings);
    setDraft({
      sortField: settings.sortField,
      sortDirection: settings.sortDirection,
      showCompleted: settings.showCompleted,
      showPriority: settings.showPriority,
    });
    setErrorMessage(null);
  };

  const isDirty
    = draft.sortField !== initialSettings.sortField
      || draft.sortDirection !== initialSettings.sortDirection
      || draft.showPriority !== initialSettings.showPriority
      || draft.showCompleted !== initialSettings.showCompleted;

  const setSortField = (value: TaskViewSortField) => {
    setDraft((current) => ({ ...current, sortField: value }));
  };

  const setSortDirection = (value: TaskViewSortDirection) => {
    setDraft((current) => ({ ...current, sortDirection: value }));
  };

  const setShowCompleted = (value: boolean) => {
    setDraft((current) => ({ ...current, showCompleted: value }));
  };

  const setShowPriority = (value: boolean) => {
    setDraft((current) => ({ ...current, showPriority: value }));
  };

  const save = async (newDraft?: TaskViewSettingsDraft, version?: number) => {
    if (isSavingInFlight.current || !isDirty) return false;

    const resultDraft = newDraft ?? draft;
    const resultVersion = version ?? initialSettings.version;

    setErrorMessage(null);
    setIsSaving(true);
    setConflictView(null);
    isSavingInFlight.current = true;
    try {
      const response = await updateViewSettings({
        ...resultDraft,
        viewId: view.id,
        expectedVersion: resultVersion,
      }).unwrap();
      setInitialSettings({
        sortField: response.sort_field,
        sortDirection: response.sort_direction,
        showCompleted: response.show_completed,
        showPriority: response.show_priority,
        version: response.version,
      });
      return true;
    } catch (error) {
      const apiError = normalizeApiError(error);

      if (apiError.status === 409) {
        const conflict = getTaskViewConflict(error, view.id);
        if (!conflict) {
          setErrorMessage(t('tasks.viewSettings.conflict'));
        } else {
          if (
            resultDraft.sortDirection === conflict.sort_direction
            && resultDraft.sortField === conflict.sort_field
            && resultDraft.showCompleted === conflict.show_completed
            && resultDraft.showPriority === conflict.show_priority
          ) {
            setInitialSettings({
              sortField: conflict.sort_field,
              sortDirection: conflict.sort_direction,
              showCompleted: conflict.show_completed,
              showPriority: conflict.show_priority,
              version: conflict.version,
            });
            return true;
          }
          setConflictView(conflict);
          return false;
        }
      } else if (
        apiError.kind === 'parsing'
        || apiError.kind === 'network'
        || apiError.kind === 'timeout'
      ) {
        setErrorMessage(t('tasks.viewSettings.unconfirmed'));
      } else {
        setErrorMessage(
          getApiErrorMessage(error) ?? t('tasks.viewSettings.saveError'),
        );
      }

      return false;
    } finally {
      setIsSaving(false);
      isSavingInFlight.current = false;
    }
  };

  const applyServerSettingsForConflict = () => {
    if (!conflictView) return;
    const newDraft = {
      sortField: conflictView.sort_field,
      sortDirection: conflictView.sort_direction,
      showCompleted: conflictView.show_completed,
      showPriority: conflictView.show_priority,
    };
    setDraft(newDraft);
    setInitialSettings({
      ...newDraft,
      version: conflictView.version,
    });
    setConflictView(null);
  };

  const applyMySettingsForConflict = () => {
    if (!conflictView) return;

    const expectedVersion = conflictView.version;
    setInitialSettings({
      sortField: conflictView.sort_field,
      sortDirection: conflictView.sort_direction,
      showCompleted: conflictView.show_completed,
      showPriority: conflictView.show_priority,
      version: expectedVersion,
    });
    setConflictView(null);

    void save(draft, expectedVersion);
  };

  const clearConflict = () => {
    setConflictView(null);
  };

  return {
    draft,
    conflictView,
    isReady: true,
    isDirty,
    isSaving,
    errorMessage,
    setSortField,
    setSortDirection,
    setShowCompleted,
    setShowPriority,
    reset,
    save,
    clearConflict,
    applyServerSettingsForConflict,
    applyMySettingsForConflict,
  };
}
