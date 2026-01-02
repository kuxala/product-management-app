import { TaskListWithTasks } from '@pm/shared';

interface TaskListBarProps {
  taskLists: TaskListWithTasks[];
  isOwner: boolean;
  onDeleteList: (listId: string) => void;
}

export function TaskListBar({ taskLists, isOwner, onDeleteList }: TaskListBarProps) {
  if (taskLists.length === 0) return null;

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Lists:</span>
        {taskLists.map((list) => (
          <div
            key={list.id}
            className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200"
          >
            <span>{list.name}</span>
            <span className="text-gray-400">({list.taskCount})</span>
            {isOwner && (
              <button
                onClick={() => onDeleteList(list.id)}
                className="ml-1 p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
