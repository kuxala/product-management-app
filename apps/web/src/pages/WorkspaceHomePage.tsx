import { useWorkspace } from '../context/WorkspaceContext';
import { LoadingSpinner } from '../components/shared';
import { SpaceCard, AddSpaceCard, QuickStats } from './components';

export function WorkspaceHomePage() {
  const { currentWorkspace, spaces, isLoading } = useWorkspace();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Workspace not found</p>
      </div>
    );
  }

  const stats = [
    { value: spaces.length, label: 'Spaces', color: 'indigo' as const },
    {
      value: spaces.reduce((acc, s) => acc + s.projectCount, 0),
      label: 'Projects',
      color: 'green' as const,
    },
    { value: currentWorkspace.memberCount, label: 'Members', color: 'purple' as const },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{currentWorkspace.name}</h1>
          {currentWorkspace.description && (
            <p className="text-gray-600 mt-1">{currentWorkspace.description}</p>
          )}
        </div>

        {/* Spaces Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Spaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                workspaceSlug={currentWorkspace.slug}
              />
            ))}
            <AddSpaceCard workspaceSlug={currentWorkspace.slug} />
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats stats={stats} />
      </div>
    </div>
  );
}
