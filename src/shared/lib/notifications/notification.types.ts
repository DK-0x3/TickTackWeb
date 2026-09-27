import type { ReactNode } from 'react';

export type NotificationTone = 'neutral' | 'success' | 'warning' | 'error';

export interface NotificationShortcut {
  key: string;
  mod?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export interface NotificationAction {
  label: string;
  shortcut?: NotificationShortcut;
  run: () => void | Promise<void>;
}

export interface NotificationInput {
  message: string;
  icon?: ReactNode;
  tone?: NotificationTone;
  // null keeps the notification visible until it is updated or dismissed.
  durationMs?: number | null;
  action?: NotificationAction | null;
}

export interface NotificationItem extends NotificationInput {
  id: string;
  isRunning: boolean;
}

export type NotificationPatch = Partial<NotificationInput>;
export type NotificationPauseReason = 'pointer' | 'focus';

export interface NotificationApi {
  show: (notification: NotificationInput) => string;
  update: (id: string, patch: NotificationPatch) => void;
  dismiss: (id: string) => void;
}

export interface NotificationController {
  api: NotificationApi;
  visible: readonly NotificationItem[];
  invoke: (id: string) => void;
  pause: (id: string, reason: NotificationPauseReason) => void;
  resume: (id: string, reason: NotificationPauseReason) => void;
}
