import { useNavigate } from 'react-router-dom';

interface ProjectHeaderProps {
  name: string;
  description?: string | null;
  memberCount: number;
  isOwner: boolean;
  onDelete: () => void;
  showAddList: boolean;
  onToggleAddList: () => void;
  newListName: string;
  onNewListNameChange: (name: string) => void;
  onCreateList: () => void;
}

export function ProjectHeader({
  name,
  description,
  memberCount,
  isOwner,
  onDelete,
  showAddList,
  onToggleAddList,
  newListName,
  onNewListNameChange,
  onCreateList,
}: ProjectHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddListControl
            showAddList={showAddList}
            onToggle={onToggleAddList}
            newListName={newListName}
            onNameChange={onNewListNameChange}
            onSubmit={onCreateList}
          />
          <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
            Members ({memberCount})
          </button>
          {isOwner && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

interface AddListControlProps {
  showAddList: boolean;
  onToggle: () => void;
  newListName: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}

function AddListControl({
  showAddList,
  onToggle,
  newListName,
  onNameChange,
  onSubmit,
}: AddListControlProps) {
  if (showAddList) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newListName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="List name"
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
            if (e.key === 'Escape') {
              onToggle();
              onNameChange('');
            }
          }}
        />
        <button
          onClick={onSubmit}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Add
        </button>
        <button
          onClick={() => {
            onToggle();
            onNameChange('');
          }}
          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onToggle}
      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
    >
      + Add List
    </button>
  );
}
