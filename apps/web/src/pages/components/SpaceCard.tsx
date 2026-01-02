import { Link } from 'react-router-dom';
import { SpaceWithProjectCount } from '@pm/shared';

interface SpaceCardProps {
  space: SpaceWithProjectCount;
  workspaceSlug: string;
}

export function SpaceCard({ space, workspaceSlug }: SpaceCardProps) {
  return (
    <Link
      to={`/w/${workspaceSlug}/s/${space.id}`}
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
  );
}

interface AddSpaceCardProps {
  workspaceSlug: string;
}

export function AddSpaceCard({ workspaceSlug }: AddSpaceCardProps) {
  return (
    <Link
      to={`/w/${workspaceSlug}/settings`}
      className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center"
    >
      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
        <svg
          className="w-5 h-5 text-gray-400"
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
      <h3 className="font-semibold text-gray-700">Add Space</h3>
      <p className="text-sm text-gray-500 mt-1">Organize your projects</p>
    </Link>
  );
}
