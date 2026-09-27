import { useContext } from 'react';

import { NotificationContext } from './notificationContext';

export function useNotifications() {
  const notifications = useContext(NotificationContext);
  if (!notifications) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }

  return notifications;
}
