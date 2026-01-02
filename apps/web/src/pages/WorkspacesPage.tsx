import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspacesApi } from '../api/workspaces';
import { WorkspaceWithRole, CreateWorkspaceDto } from '@pm/shared';
import { getError } from '../api/client';
import { LoadingSpinner, ErrorAlert } from '../components/shared';
import {
  WorkspaceCard,
  CreateWorkspaceCard,
  CreateWorkspaceModal,
} from './components';

export function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const data = await workspacesApi.getAll();
      setWorkspaces(data);

      // If user has exactly one workspace, redirect to it
      if (data.length === 1) {
        navigate(`/w/${data[0].slug}`);
      }
    } catch (err) {
      setError(getError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (formData: CreateWorkspaceDto) => {
    setError('');
    try {
      const workspace = await workspacesApi.create(formData);
      setShowCreateModal(false);
      navigate(`/w/${workspace.slug}`);
    } catch (err) {
      setError(getError(err));
      throw err;
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Workspaces</h1>
          <p className="text-gray-600">Select a workspace or create a new one</p>
        </div>

        {error && !showCreateModal && (
          <ErrorAlert
            message={error}
            onDismiss={() => setError('')}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              workspace={workspace}
              onClick={() => navigate(`/w/${workspace.slug}`)}
            />
          ))}
          <CreateWorkspaceCard onClick={() => setShowCreateModal(true)} />
        </div>
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setError('');
        }}
        onSubmit={handleCreate}
        error={error}
      />
    </div>
  );
}
