import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type TaskViewDto, useSetViewCollapsedMutation } from '@/entities/task-view';
import { normalizeApiError } from '@/shared/api';

export function useTaskViewCollapse(view: TaskViewDto) {
  const { t } = useTranslation();
  const [setCollapsed] = useSetViewCollapsedMutation();
  const inFlight = useRef(false);
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);
  const [failure, setFailure] = useState<{ value: boolean; unconfirmed: boolean } | null>(null);

  const save = async (isCollapsed: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPendingValue(isCollapsed);
    setFailure(null);
    try {
      await setCollapsed({ viewId: view.id, isCollapsed }).unwrap();
    } catch (error) {
      setFailure({ value: isCollapsed, unconfirmed: normalizeApiError(error).kind !== 'client' });
    } finally {
      inFlight.current = false;
      setPendingValue(null);
    }
  };

  return {
    isCollapsed: pendingValue ?? view.is_collapsed,
    isCollapseSaving: pendingValue !== null,
    collapseErrorMessage: failure
      ? t(failure.unconfirmed ? 'tasks.list.collapseUnconfirmed' : 'tasks.list.collapseSaveError')
      : null,
    onCollapsedChange: (value: boolean) => { void save(value); },
    onRetryCollapse: () => { if (failure) void save(failure.value); },
  };
}
