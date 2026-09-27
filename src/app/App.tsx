import { RouterProvider } from 'react-router-dom';

import { ThemeProvider } from '@/shared/lib/theme';
import { NotificationProvider } from '@/shared/lib/notifications';

import { router } from '@/app/router';

import styles from './App.module.scss';

export function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <div className={styles.app}>
          <RouterProvider router={router} />
        </div>
      </NotificationProvider>
    </ThemeProvider>
  );
}
