import type { PropsWithChildren } from 'react';

import { NotificationViewport } from '@/shared/ui/notification';

import { NotificationContext } from './notificationContext';
import { useNotificationController } from './useNotificationController';

export function NotificationProvider({ children }: PropsWithChildren) {
  const { api, visible, invoke, pause, resume } = useNotificationController();

  return (
    <NotificationContext.Provider value={api}>
      {children}
      <NotificationViewport
        notifications={visible}
        onInvoke={invoke}
        onPause={pause}
        onResume={resume}
      />
    </NotificationContext.Provider>
  );
}
