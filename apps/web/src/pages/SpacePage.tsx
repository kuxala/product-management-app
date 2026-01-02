import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { spacesApi } from '../api/spaces';
import { projectsApi } from '../api/projects';
import { useWorkspace } from '../context/WorkspaceContext';
import { SpaceWithProjectCount, Project, CreateProjectDto } from '@pm/shared';
import { getError } from '../api/client';
import { LoadingSpinner, ErrorAlert, EmptyState } from '../components/shared';
import { ProjectCard, CreateProjectModal, SpaceHeader } from './components';

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
  const [error, setError] = useState('');

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

  const handleCreate = async (formData: CreateProjectDto) => {
    if (!spaceId) return;
    setError('');

    try {
      const project = await projectsApi.create(spaceId, formData);
      setProjects([project, ...projects]);
      setShowCreateModal(false);
    } catch (err) {
      setError(getError(err));
      throw err;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
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
        <SpaceHeader
          name={space.name}
          description={space.description}
          color={space.color}
          onCreateProject={() => setShowCreateModal(true)}
        />

        {error && !showCreateModal && (
          <ErrorAlert
            message={error}
            onDismiss={() => setError('')}
            className="mb-6"
          />
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              workspaceSlug={currentWorkspace?.slug || ''}
            />
          ))}

          {projects.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                }
                title="No projects yet"
                description="Create your first project in this space"
                action={{
                  label: 'Create Project',
                  onClick: () => setShowCreateModal(true),
                }}
              />
            </div>
          )}
        </div>
      </div>

      <CreateProjectModal
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
