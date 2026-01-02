import { WorkspaceWithRole } from '@pm/shared';

interface WorkspaceCardProps {
  workspace: WorkspaceWithRole;
  onClick: () => void;
}

export function WorkspaceCard({ workspace, onClick }: WorkspaceCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-indigo-100 text-indigo-700';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <button
      onClick={onClick}
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
          className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeStyles(workspace.role)}`}
        >
          {workspace.role}
        </span>
      </div>
    </button>
  );
}

export function CreateWorkspaceCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition border-2 border-dashed border-gray-300 text-center"
    >
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <h3 className="font-semibold text-gray-900">Create Workspace</h3>
      <p className="text-sm text-gray-500 mt-1">Start a new team or project</p>
    </button>
  );
}
