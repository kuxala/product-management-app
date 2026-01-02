import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { WorkspaceProvider } from '../../context/WorkspaceContext';
import { NavigationProvider } from '../../context/NavigationContext';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <WorkspaceProvider>
      <NavigationProvider>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children || <Outlet />}
          </main>
        </div>
      </NavigationProvider>
    </WorkspaceProvider>
  );
}
