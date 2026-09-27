import { createContext } from 'react';

import type { NotificationApi } from './notification.types';

export const NotificationContext = createContext<NotificationApi | null>(null);
