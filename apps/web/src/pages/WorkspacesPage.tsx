import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspacesApi } from '../api/workspaces';
import { WorkspaceWithRole, CreateWorkspaceDto } from '@pm/shared';
import { getError } from '../api/client';

export function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<CreateWorkspaceDto>({ name: '', slug: '' });
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      const workspace = await workspacesApi.create(formData);
      setShowCreateModal(false);
      setFormData({ name: '', slug: '' });
      navigate(`/w/${workspace.slug}`);
    } catch (err) {
      setError(getError(err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData({
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Workspaces</h1>
          <p className="text-gray-600">Select a workspace or create a new one</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => navigate(`/w/${workspace.slug}`)}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition text-left"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                  {workspace.logoUrl ? (
                    <img
                      src={workspace.logoUrl}
                      alt={workspace.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    getInitials(workspace.name)
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
                  <p className="text-sm text-gray-500">
                    {workspace.memberCount} member{workspace.memberCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    workspace.role === 'OWNER'
                      ? 'bg-indigo-100 text-indigo-700'
                      : workspace.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {workspace.role}
                </span>
              </div>
            </button>
          ))}

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition border-2 border-dashed border-gray-300 text-center"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Create Workspace</h3>
            <p className="text-sm text-gray-500 mt-1">Start a new team or project</p>
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Workspace</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                  placeholder="My Workspace"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">/w/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="flex-1 px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                    placeholder="my-workspace"
                    required
                  />
                </div>
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
