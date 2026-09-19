import { RouterProvider } from 'react-router-dom';

import { ThemeProvider } from '@/shared/lib/theme';

import { router } from '@/app/router';

import styles from './App.module.scss';

export function App() {
  return (
    <ThemeProvider>
      <div className={styles.app}>
        <RouterProvider router={router} />
      </div>
    </ThemeProvider>
  );
}
