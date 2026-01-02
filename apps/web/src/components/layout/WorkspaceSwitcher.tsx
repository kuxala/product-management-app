import { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { WorkspaceWithRole } from '@pm/shared';

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelect = (workspace: WorkspaceWithRole) => {
    switchWorkspace(workspace.slug);
    setIsOpen(false);
  };

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full p-3 hover:bg-gray-100 rounded-xl transition"
      >
        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-sm">
          {currentWorkspace.logoUrl ? (
            <img
              src={currentWorkspace.logoUrl}
              alt={currentWorkspace.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            getInitials(currentWorkspace.name)
          )}
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-gray-900 truncate">
            {currentWorkspace.name}
          </div>
          <div className="text-xs text-gray-500">
            {currentWorkspace.memberCount} member{currentWorkspace.memberCount !== 1 ? 's' : ''}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => handleSelect(workspace)}
              className={`flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 transition ${
                workspace.id === currentWorkspace.id ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                {workspace.logoUrl ? (
                  <img
                    src={workspace.logoUrl}
                    alt={workspace.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  getInitials(workspace.name)
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {workspace.name}
                </div>
              </div>
              {workspace.id === currentWorkspace.id && (
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
          <hr className="my-2 border-gray-200" />
          <a
            href="/workspaces"
            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-gray-50 transition text-gray-600"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm">Create or join workspace</span>
          </a>
        </div>
      )}
    </div>
  );
}
