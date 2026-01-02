import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { WorkspaceHomePage } from './pages/WorkspaceHomePage';
import { SpacePage } from './pages/SpacePage';
import ProjectPage from './pages/ProjectPage';
import { AppLayout } from './components/layout/AppLayout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Workspace selection */}
          <Route
            path="/workspaces"
            element={
              <ProtectedRoute>
                <WorkspacesPage />
              </ProtectedRoute>
            }
          />

          {/* Workspace routes with layout */}
          <Route
            path="/w/:workspaceSlug"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<WorkspaceHomePage />} />
            <Route path="s/:spaceId" element={<SpacePage />} />
            <Route path="p/:projectId" element={<ProjectPage />} />
            <Route path="settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-500 mt-2">Workspace settings coming soon...</p></div>} />
            <Route path="members" element={<div className="p-8"><h1 className="text-2xl font-bold">Members</h1><p className="text-gray-500 mt-2">Member management coming soon...</p></div>} />
          </Route>

          {/* Legacy route redirects */}
          <Route path="/dashboard" element={<Navigate to="/workspaces" replace />} />
          <Route path="/projects/:id" element={<Navigate to="/workspaces" replace />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/workspaces" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
