import type { NotificationShortcut } from './notification.types';

export function isApplePlatform(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPad|iPhone/.test(navigator.userAgent);
}

export function formatNotificationShortcut(shortcut: NotificationShortcut): string {
  const isApple = isApplePlatform();
  const parts = [
    shortcut.mod ? (isApple ? '⌘' : 'Ctrl') : null,
    shortcut.alt ? (isApple ? '⌥' : 'Alt') : null,
    shortcut.shift ? (isApple ? '⇧' : 'Shift') : null,
    shortcut.key.toUpperCase(),
  ].filter(Boolean);

  return parts.join(isApple ? '' : '+');
}
