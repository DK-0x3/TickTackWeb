import { Outlet } from 'react-router-dom';

import { AppHeader } from '@/widgets/app-header';
import { AppSidebar } from '@/widgets/app-sidebar';

import styles from './MainLayout.module.scss';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

const SIDEBAR_MENU_COLLAPSE_KEY = 'SIDEBAR_MENU_COLLAPSE';
function getSidebarMenuCollapsedState() {
  return localStorage.getItem(SIDEBAR_MENU_COLLAPSE_KEY) === 'true';
}
function setSidebarMenuCollapsedState(value: boolean) {
  localStorage.setItem(SIDEBAR_MENU_COLLAPSE_KEY, String(value));
}

export function MainLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getSidebarMenuCollapsedState());

  useEffect(() => {
    setSidebarMenuCollapsedState(isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  return (
    <div className={clsx(styles.layout, isSidebarCollapsed && styles.collapsed)}>
      <AppSidebar isCollapsed={isSidebarCollapsed} onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)} />

      <div className={styles.workspace}>
        <AppHeader />

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
