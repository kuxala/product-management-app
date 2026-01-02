import { useState, useMemo } from 'react';
import { Task, TaskList, ViewConfig, TaskStatus, TaskPriority } from '@pm/shared';

interface ListViewProps {
  tasks: Task[];
  taskLists: TaskList[];
  viewConfig?: ViewConfig;
  onTaskUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
}

type SortField = 'title' | 'status' | 'priority' | 'dueDate' | 'assignee' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export function ListView({
  tasks,
  taskLists,
  viewConfig,
  onTaskUpdate,
  onTaskDelete,
}: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Group tasks by the configured groupBy field
  const groupBy = viewConfig?.groupBy || 'none';

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'priority': {
          const priorityOrder: Record<TaskPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'assignee':
          comparison = (a.assignee?.name || '').localeCompare(b.assignee?.name || '');
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortField, sortDirection]);

  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: 'All Tasks', tasks: sortedTasks }];
    }

    const groups: Record<string, Task[]> = {};

    for (const task of sortedTasks) {
      let groupKey: string;

      switch (groupBy) {
        case 'status':
          groupKey = task.status;
          break;
        case 'priority':
          groupKey = task.priority;
          break;
        case 'assigneeId':
          groupKey = task.assigneeId || 'unassigned';
          break;
        case 'taskListId':
          groupKey = task.taskListId || 'no-list';
          break;
        default:
          groupKey = 'all';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    }

    return Object.entries(groups).map(([key, tasks]) => ({
      key,
      label: getGroupLabel(groupBy, key, taskLists),
      tasks,
    }));
  }, [sortedTasks, groupBy, taskLists]);

  const toggleRow = (taskId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-5">
          <SortableHeader
            label="Title"
            field="title"
            currentField={sortField}
            direction={sortDirection}
            onClick={toggleSort}
          />
        </div>
        <div className="col-span-2">
          <SortableHeader
            label="Status"
            field="status"
            currentField={sortField}
            direction={sortDirection}
            onClick={toggleSort}
          />
        </div>
        <div className="col-span-2">
          <SortableHeader
            label="Priority"
            field="priority"
            currentField={sortField}
            direction={sortDirection}
            onClick={toggleSort}
          />
        </div>
        <div className="col-span-2">
          <SortableHeader
            label="Due Date"
            field="dueDate"
            currentField={sortField}
            direction={sortDirection}
            onClick={toggleSort}
          />
        </div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-100">
        {groupedTasks.map((group) => (
          <div key={group.key}>
            {groupBy !== 'none' && (
              <div className="px-4 py-2 bg-gray-50 font-medium text-sm text-gray-700">
                {group.label} ({group.tasks.length})
              </div>
            )}

            {group.tasks.map((task) => (
              <ListViewRow
                key={task.id}
                task={task}
                isExpanded={expandedRows.has(task.id)}
                onToggle={() => toggleRow(task.id)}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}

            {group.tasks.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No tasks in this group
              </div>
            )}
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="px-4 py-12 text-center text-gray-400">
            No tasks match the current filters
          </div>
        )}
      </div>
    </div>
  );
}

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onClick: (field: SortField) => void;
}

function SortableHeader({
  label,
  field,
  currentField,
  direction,
  onClick,
}: SortableHeaderProps) {
  const isActive = currentField === field;

  return (
    <button
      onClick={() => onClick(field)}
      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
    >
      <span>{label}</span>
      {isActive && (
        <svg
          className={`w-4 h-4 transition-transform ${direction === 'desc' ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )}
    </button>
  );
}

interface ListViewRowProps {
  task: Task;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

function ListViewRow({ task, isExpanded, onToggle, onUpdate, onDelete }: ListViewRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = async (status: TaskStatus) => {
    await onUpdate(task.id, { status });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div className="group hover:bg-gray-50 transition-colors">
      <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
        {/* Title */}
        <div className="col-span-5 flex items-center gap-2">
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className={`font-medium ${task.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {task.title}
          </span>
        </div>

        {/* Status */}
        <div className="col-span-2">
          <StatusBadge status={task.status} onChange={handleStatusChange} />
        </div>

        {/* Priority */}
        <div className="col-span-2">
          <PriorityBadge priority={task.priority} />
        </div>

        {/* Due Date */}
        <div className="col-span-2">
          {task.dueDate ? (
            <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
              {formatDate(task.dueDate)}
            </span>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-10">
          <p className="text-sm text-gray-600">
            {task.description || 'No description'}
          </p>
          {task.assignee && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <span>Assigned to:</span>
              <span className="font-medium">{task.assignee.name}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  onChange,
}: {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
}) {
  const colors: Record<TaskStatus, string> = {
    TODO: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    DONE: 'bg-green-100 text-green-800',
  };

  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${colors[status]}`}
    >
      <option value="TODO">To Do</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="DONE">Done</option>
    </select>
  );
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const colors: Record<TaskPriority, string> = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors[priority]}`}>
      {priority}
    </span>
  );
}

// Helper functions
function formatStatus(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
  };
  return labels[status];
}

function formatPriority(priority: TaskPriority): string {
  const labels: Record<TaskPriority, string> = {
    LOW: 'Low Priority',
    MEDIUM: 'Medium Priority',
    HIGH: 'High Priority',
  };
  return labels[priority];
}

function getGroupLabel(
  groupBy: string,
  key: string,
  taskLists: TaskList[]
): string {
  switch (groupBy) {
    case 'status':
      return formatStatus(key as TaskStatus);
    case 'priority':
      return formatPriority(key as TaskPriority);
    case 'taskListId':
      return taskLists.find((l) => l.id === key)?.name || 'No List';
    default:
      return key;
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
