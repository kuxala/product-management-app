import { Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';

export function WorkspaceHomePage() {
  const { currentWorkspace, spaces, isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Workspace not found</p>
      </div>
    );
  }

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
              <Link
                key={space.id}
                to={`/w/${currentWorkspace.slug}/s/${space.id}`}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: space.color + '20' }}
                  >
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: space.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{space.name}</h3>
                    <p className="text-sm text-gray-500">
                      {space.projectCount} project{space.projectCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {space.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{space.description}</p>
                )}
              </Link>
            ))}

            {/* Add Space Card */}
            <Link
              to={`/w/${currentWorkspace.slug}/settings`}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-700">Add Space</h3>
              <p className="text-sm text-gray-500 mt-1">Organize your projects</p>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="text-3xl font-bold text-indigo-600">{spaces.length}</div>
            <div className="text-gray-600">Spaces</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="text-3xl font-bold text-green-600">
              {spaces.reduce((acc, s) => acc + s.projectCount, 0)}
            </div>
            <div className="text-gray-600">Projects</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="text-3xl font-bold text-purple-600">
              {currentWorkspace.memberCount}
            </div>
            <div className="text-gray-600">Members</div>
          </div>
        </div>
      </div>
    </div>
  );
}
