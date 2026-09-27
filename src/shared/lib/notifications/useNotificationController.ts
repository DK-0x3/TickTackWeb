import type {
  NotificationController,
  NotificationInput,
  NotificationItem, NotificationPatch,
  NotificationPauseReason,
} from './notification.types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuid4 } from 'uuid';
import { isApplePlatform } from '@/shared/lib/notifications/notificationShortcut';
import { isEditableTarget } from '@/shared/utils/isEditableTarget';

interface TimerState {
  timeoutId: ReturnType<typeof setTimeout> | null;
  remainingMs: number | null;
  startedAt: number | null;
  pausedBy: Set<'pointer' | 'focus'>;
}

const MAX_VISIBLE_ITEMS = 3;
const DEFAULT_TIMER_DURATION = 5000;

export function useNotificationController(): NotificationController {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const timersMap = useRef<Map<string, TimerState>>(new Map());
  const runningIds = useRef<Set<string>>(new Set());
  const visibleItems = useMemo(() => items.slice(0, MAX_VISIBLE_ITEMS), [items]);

  const getOrCreateTimer = (item: NotificationItem): TimerState => {
    const createdTimer = timersMap.current.get(item.id);
    if (createdTimer) {
      return createdTimer;
    }
    const timer: TimerState = {
      timeoutId: null,
      remainingMs: item.durationMs === undefined ? DEFAULT_TIMER_DURATION : item.durationMs,
      startedAt: null,
      pausedBy: new Set(),
    };
    timersMap.current.set(item.id, timer);
    return timer;
  };

  const show = (input: NotificationInput): string => {
    const id = uuid4();
    setItems((prev) => [...prev, {
      ...input,
      id,
      isRunning: false,
    }]);
    return id;
  };

  const dismiss = (id: string) => {
    const timer = timersMap.current.get(id);
    if (timer && timer.timeoutId !== null) {
      clearTimeout(timer.timeoutId);
    }
    timersMap.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const startTimer = useCallback((id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const timer = getOrCreateTimer(item);
    if (timer.remainingMs === null) return;
    if (timer && (timer.pausedBy.size !== 0 || runningIds.current.has(id) || timer.timeoutId !== null)) return;

    const timeoutId = setTimeout(() => dismiss(id), timer.remainingMs);
    timer.startedAt = performance.now();
    timer.timeoutId = timeoutId;
  }, [items]);

  const stopTimer = (timer: TimerState) => {
    if (timer.timeoutId !== null) clearTimeout(timer.timeoutId);
    timer.startedAt = null;
    timer.timeoutId = null;
  };

  const pause = (id: string, reason: NotificationPauseReason) => {
    const timer = timersMap.current.get(id);
    if (!timer) return;
    timer.pausedBy.add(reason);
    if (timer.timeoutId === null || timer.startedAt === null
      || timer.remainingMs === null) return;

    const elapsed = performance.now() - timer.startedAt;
    timer.remainingMs = Math.max(0, timer.remainingMs - elapsed);
    stopTimer(timer);
  };

  const resume = (id: string, reason: NotificationPauseReason) => {
    const timer = timersMap.current.get(id);
    if (!timer) return;
    if (timer.timeoutId !== null || timer.startedAt !== null) return;
    timer.pausedBy.delete(reason);
    if (timer.pausedBy.size === 0) {
      startTimer(id);
    }
  };

  const updateItem = (id: string, patch: NotificationPatch & { isRunning?: boolean }) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));
  };

  const invoke = useCallback((id: string) => {
    if (runningIds.current.has(id)) return;
    const item = items.find((i) => i.id === id);
    if (!item?.action) return;
    const timer = timersMap.current.get(id);

    updateItem(id, { isRunning: true });
    runningIds.current.add(id);

    const cleanup = () => {
      runningIds.current.delete(id);
      updateItem(id, { isRunning: false });
    };

    try {
      if (timer) stopTimer(timer);
      const result = item.action.run();
      void Promise.resolve(result)
        .then(() => {
          dismiss(id);
        })
        .catch((error: unknown) => {
          console.error('Notification action failed', error);
        })
        .finally(cleanup);
    } catch (error) {
      console.error('Notification action failed', error);
      cleanup();
    }
  }, [items]);

  const update = (id: string, patch: NotificationPatch) => {
    const timer = timersMap.current.get(id);
    updateItem(id, patch);
    if (patch.durationMs !== undefined && timer) {
      stopTimer(timer);
      timer.remainingMs = patch.durationMs;
    }
  };

  useEffect(() => {
    visibleItems.forEach((item) => {
      startTimer(item.id);
    });
  }, [visibleItems, startTimer]);

  useEffect(() => {
    const timers = timersMap.current;
    return () => {
      timers.forEach((timer) => {
        stopTimer(timer);
      });
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.isComposing || e.defaultPrevented || isEditableTarget(e.target)) return;

      const key = e.key;
      const mod = isApplePlatform() ? e.metaKey : e.ctrlKey;
      const alt = e.altKey;
      const shift = e.shiftKey;

      for (let i = visibleItems.length - 1; i >= 0; i--) {
        const item = visibleItems[i];
        if (!item) return;
        const shortcut = item.action?.shortcut;
        if (!shortcut) continue;
        if (shortcut.key.toLowerCase() !== key.toLowerCase()) continue;
        if ((mod && !shortcut.mod) || (!mod && shortcut.mod)) continue;
        if ((alt && !shortcut.alt) || (!alt && shortcut.alt)) continue;
        if ((shift && !shortcut.shift) || (!shift && shortcut.shift)) continue;

        e.preventDefault();
        invoke(item.id);
        break;
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [invoke, visibleItems]);

  return {
    api: {
      show,
      update,
      dismiss,
    },
    visible: visibleItems,
    invoke,
    pause,
    resume,
  };
}
