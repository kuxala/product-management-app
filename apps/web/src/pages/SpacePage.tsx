import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { spacesApi } from '../api/spaces';
import { projectsApi } from '../api/projects';
import { useWorkspace } from '../context/WorkspaceContext';
import { SpaceWithProjectCount, Project, CreateProjectDto } from '@pm/shared';
import { getError } from '../api/client';

interface SpaceWithProjects extends SpaceWithProjectCount {
  projects?: Project[];
}

export function SpacePage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const { currentWorkspace } = useWorkspace();
  const [space, setSpace] = useState<SpaceWithProjects | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<CreateProjectDto>({ name: '' });
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (spaceId) {
      loadSpace();
    }
  }, [spaceId]);

  const loadSpace = async () => {
    if (!spaceId) return;

    try {
      const spaceData = await spacesApi.getById(spaceId);
      setSpace(spaceData);

      const projectsData = await projectsApi.getAllInSpace(spaceId);
      setProjects(projectsData);
    } catch (err) {
      setError(getError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spaceId) return;

    setIsCreating(true);
    setError('');

    try {
      const project = await projectsApi.create(spaceId, formData);
      setProjects([project, ...projects]);
      setShowCreateModal(false);
      setFormData({ name: '' });
    } catch (err) {
      setError(getError(err));
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Space not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: space.color + '20' }}
            >
              <div
                className="w-5 h-5 rounded"
                style={{ backgroundColor: space.color }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{space.name}</h1>
              {space.description && (
                <p className="text-gray-600">{space.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
          >
            New Project
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/w/${currentWorkspace?.slug}/p/${project.id}`}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                    {project.owner.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{project.owner.name}</span>
                </div>
                <span>{project._count.tasks} tasks</span>
              </div>
            </Link>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">Create your first project in this space</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
              >
                Create Project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Project</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
                  placeholder="My Project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition resize-none"
                  rows={3}
                  placeholder="Brief description of the project"
                />
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
