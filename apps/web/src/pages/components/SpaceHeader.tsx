interface SpaceHeaderProps {
  name: string;
  description?: string | null;
  color: string;
  onCreateProject: () => void;
}

export function SpaceHeader({
  name,
  description,
  color,
  onCreateProject,
}: SpaceHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <div
            className="w-5 h-5 rounded"
            style={{ backgroundColor: color }}
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
      </div>
      <button
        onClick={onCreateProject}
        className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-medium"
      >
        New Project
      </button>
    </div>
  );
}
