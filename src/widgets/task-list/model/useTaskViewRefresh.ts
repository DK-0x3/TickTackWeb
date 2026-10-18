import { useEffect, useRef } from 'react';

import { normalizeApiError } from '@/shared/api';

interface TaskViewRefreshOptions {
  nextRefreshAt: string | undefined;
  error: unknown;
  hasFreshData: boolean;
  onRestart: () => void;
}

export function useTaskViewRefresh({ nextRefreshAt, error, hasFreshData, onRestart }: TaskViewRefreshOptions) {
  const expiredDeadline = useRef<string | null>(null);
  const recoveryAttempted = useRef(false);

  useEffect(() => {
    if (!nextRefreshAt) return;
    const deadline = Date.parse(nextRefreshAt);
    if (!Number.isFinite(deadline)) return;

    const refreshIfExpired = () => {
      if (Date.now() < deadline || expiredDeadline.current === nextRefreshAt) return;
      // A failed request must not repeatedly refresh against the old deadline.
      expiredDeadline.current = nextRefreshAt;
      onRestart();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshIfExpired();
    };
    const timer = window.setTimeout(refreshIfExpired, Math.max(0, deadline - Date.now()) + 100);

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', refreshIfExpired);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', refreshIfExpired);
    };
  }, [nextRefreshAt, onRestart]);

  useEffect(() => {
    if (hasFreshData && !error) {
      recoveryAttempted.current = false;
      return;
    }

    const normalized = normalizeApiError(error);
    if (normalized.status !== 409 || normalized.code !== 'view_conflict' || recoveryAttempted.current) return;

    // Recover once; a failed first page leaves the normal retry action available.
    const timer = window.setTimeout(() => {
      recoveryAttempted.current = true;
      onRestart();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [error, hasFreshData, onRestart]);
}
