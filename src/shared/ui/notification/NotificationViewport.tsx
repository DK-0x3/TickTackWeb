import { formatNotificationShortcut } from '@/shared/lib/notifications/notificationShortcut';
import type { NotificationItem, NotificationPauseReason } from '@/shared/lib/notifications/notification.types';

import styles from './NotificationViewport.module.scss';

interface NotificationViewportProps {
  notifications: readonly NotificationItem[];
  onInvoke: (id: string) => void;
  onPause: (id: string, reason: NotificationPauseReason) => void;
  onResume: (id: string, reason: NotificationPauseReason) => void;
}

export function NotificationViewport({
  notifications,
  onInvoke,
  onPause,
  onResume,
}: NotificationViewportProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.viewport}>
      {notifications.map((notification) => {
        const content = (
          <>
            {notification.icon
              ? <span className={styles.icon} aria-hidden="true">{notification.icon}</span>
              : null}
            <span className={styles.message}>{notification.message}</span>
            {notification.action
              ? (
                  <span className={styles.action}>
                    <span>{notification.action.label}</span>
                    {notification.action.shortcut
                      ? (
                          <kbd className={styles.shortcut} aria-hidden="true">
                            {formatNotificationShortcut(notification.action.shortcut)}
                          </kbd>
                        )
                      : null}
                  </span>
                )
              : null}
          </>
        );

        return (
          <div
            key={notification.id}
            className={styles.notification}
            data-tone={notification.tone ?? 'neutral'}
            role={notification.tone === 'error' ? 'alert' : 'status'}
            aria-atomic="true"
            aria-busy={notification.isRunning}
            onMouseEnter={() => onPause(notification.id, 'pointer')}
            onMouseLeave={() => onResume(notification.id, 'pointer')}
            onFocusCapture={() => onPause(notification.id, 'focus')}
            onBlurCapture={() => onResume(notification.id, 'focus')}
          >
            {notification.action
              ? (
                  <button
                    className={styles.content}
                    type="button"
                    aria-disabled={notification.isRunning}
                    onClick={() => {
                      if (!notification.isRunning) {
                        onInvoke(notification.id);
                      }
                    }}
                  >
                    {content}
                  </button>
                )
              : <div className={styles.content}>{content}</div>}
          </div>
        );
      })}
    </div>
  );
}
