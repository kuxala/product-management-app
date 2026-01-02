import { Link, useParams } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { SpaceWithProjectCount } from '@pm/shared';

export function Sidebar() {
  const { currentWorkspace, spaces } = useWorkspace();
  const { favorites, recentItems, expandedSpaces, toggleSpace } = useNavigation();
  const { logout } = useAuth();
  const { workspaceSlug, spaceId: activeSpaceId } = useParams();

  if (!currentWorkspace) {
    return null;
  }

  const renderSpaceItem = (space: SpaceWithProjectCount) => {
    const isExpanded = expandedSpaces.has(space.id);

    return (
      <div key={space.id}>
        <button
          onClick={() => toggleSpace(space.id)}
          className={`flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded-lg transition text-left ${
            activeSpaceId === space.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
          }`}
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div
            className="w-3 h-3 rounded"
            style={{ backgroundColor: space.color }}
          />
          <span className="flex-1 truncate font-medium">{space.name}</span>
          <span className="text-xs text-gray-400">{space.projectCount}</span>
        </button>

        {isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            <Link
              to={`/w/${workspaceSlug}/s/${space.id}`}
              className="block px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              View all projects
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Workspace Switcher */}
      <div className="p-3 border-b border-gray-200">
        <WorkspaceSwitcher />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Favorites */}
        {favorites.length > 0 && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Favorites
            </h3>
            <div className="space-y-1">
              {favorites.slice(0, 5).map((fav) => (
                <Link
                  key={fav.id}
                  to={getFavoriteLink(fav, workspaceSlug || '')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="truncate">{getFavoriteName(fav)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent */}
        {recentItems.length > 0 && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Recent
            </h3>
            <div className="space-y-1">
              {recentItems.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to={getRecentLink(item, workspaceSlug || '')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="truncate">{getRecentName(item)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Spaces */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Spaces
            </h3>
            <Link
              to={`/w/${workspaceSlug}/settings`}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>
          <div className="space-y-1">
            {spaces.map(renderSpaceItem)}
          </div>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-gray-200 space-y-1">
        <Link
          to={`/w/${workspaceSlug}/settings`}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </Link>
        <Link
          to={`/w/${workspaceSlug}/members`}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Members
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition text-left"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}

// Helper functions
interface FavoriteItem {
  targetType: string;
  targetId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any;
}

function getFavoriteLink(fav: FavoriteItem, workspaceSlug: string): string {
  switch (fav.targetType) {
    case 'WORKSPACE':
      return `/w/${fav.target?.slug || workspaceSlug}`;
    case 'SPACE':
      return `/w/${workspaceSlug}/s/${fav.targetId}`;
    case 'PROJECT':
      return `/w/${workspaceSlug}/p/${fav.targetId}`;
    case 'TASK':
      return `/w/${workspaceSlug}/t/${fav.targetId}`;
    default:
      return `/w/${workspaceSlug}`;
  }
}

function getFavoriteName(fav: FavoriteItem): string {
  return fav.target?.name || fav.target?.title || 'Unknown';
}

function getRecentLink(item: FavoriteItem, workspaceSlug: string): string {
  return getFavoriteLink(item, workspaceSlug);
}

function getRecentName(item: FavoriteItem): string {
  return getFavoriteName(item);
}
