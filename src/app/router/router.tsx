import { Navigate, createBrowserRouter } from 'react-router-dom';

import { InboxPage } from '@/pages/inbox';
import { NotFoundPage } from '@/pages/not-found';
import { TodayPage } from '@/pages/today';
import { TagsPage } from '@/pages/tags';
import { SettingsPage } from '@/pages/settings';
import { MainLayout } from '@/app/layouts/main-layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/inbox" replace />,
      },
      {
        path: 'inbox',
        element: <InboxPage />,
      },
      {
        path: 'today',
        element: <TodayPage />,
      },
      {
        path: 'tags',
        element: <TagsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
