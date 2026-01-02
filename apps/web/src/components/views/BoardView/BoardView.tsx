import { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskListWithTasks, ViewConfig, TaskStatus, TaskPriority } from '@pm/shared';

interface BoardViewProps {
  taskLists: TaskListWithTasks[];
  viewConfig?: ViewConfig;
  onTaskUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onTaskCreate: (listId: string, data: { title: string }) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onTaskMove: (taskId: string, listId: string, position: number) => Promise<void>;
}

export function BoardView({
  taskLists,
  viewConfig: _viewConfig,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onTaskMove,
}: BoardViewProps) {
  // viewConfig will be used in future for board customization
  void _viewConfig;
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const activeTask = useMemo(() => {
    if (!activeId) return null;
    for (const list of taskLists) {
      const task = list.tasks.find((t) => t.id === activeId);
      if (task) return task;
    }
    return null;
  }, [activeId, taskLists]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Handle drag over for moving between columns (future enhancement)
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // Find source list
    let sourceListId: string | null = null;
    for (const list of taskLists) {
      if (list.tasks.some((t) => t.id === activeTaskId)) {
        sourceListId = list.id;
        break;
      }
    }

    // Determine target list and position
    let targetListId: string | null = null;
    let targetPosition = 0;

    // Check if over a list directly
    const overList = taskLists.find((l) => l.id === overId);
    if (overList) {
      targetListId = overList.id;
      targetPosition = overList.tasks.length;
    } else {
      // Over a task - find its list
      for (const list of taskLists) {
        const taskIndex = list.tasks.findIndex((t) => t.id === overId);
        if (taskIndex !== -1) {
          targetListId = list.id;
          targetPosition = taskIndex;
          break;
        }
      }
    }

    if (targetListId && sourceListId !== targetListId) {
      await onTaskMove(activeTaskId, targetListId, targetPosition);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {taskLists.map((list) => (
          <BoardColumn
            key={list.id}
            list={list}
            onTaskCreate={onTaskCreate}
            onTaskUpdate={onTaskUpdate}
            onTaskDelete={onTaskDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <BoardCardOverlay task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
}

interface BoardColumnProps {
  list: TaskListWithTasks;
  onTaskCreate: (listId: string, data: { title: string }) => Promise<void>;
  onTaskUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
}

function BoardColumn({ list, onTaskCreate, onTaskUpdate, onTaskDelete }: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    await onTaskCreate(list.id, { title: newTaskTitle.trim() });
    setNewTaskTitle('');
    setIsAdding(false);
  };

  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 rounded-lg p-3">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{list.name}</h3>
        <span className="text-sm text-gray-500">{list.tasks.length}</span>
      </div>

      {/* Task List */}
      <SortableContext
        items={list.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[100px]">
          {list.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onUpdate={onTaskUpdate}
              onDelete={onTaskDelete}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Task */}
      {isAdding ? (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTask();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewTaskTitle('');
              }
            }}
            placeholder="Enter task title..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddTask}
              className="px-3 py-1.5 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewTaskTitle('');
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-3 w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
      )}
    </div>
  );
}

interface SortableTaskCardProps {
  task: Task;
  onUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

function SortableTaskCard({ task, onUpdate, onDelete }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-grab hover:shadow-md transition-shadow"
    >
      <BoardCardContent task={task} onUpdate={onUpdate} onDelete={onDelete} />
    </div>
  );
}

function BoardCardOverlay({ task }: { task: Task }) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-lg border border-indigo-200 cursor-grabbing rotate-3">
      <BoardCardContent task={task} onUpdate={async () => {}} onDelete={async () => {}} />
    </div>
  );
}

interface BoardCardContentProps {
  task: Task;
  onUpdate: (taskId: string, data: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

function BoardCardContent({ task, onUpdate, onDelete }: BoardCardContentProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = async (status: TaskStatus) => {
    await onUpdate(task.id, { status });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h4 className={`text-sm font-medium ${task.status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {task.title}
        </h4>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityIndicator priority={task.priority} />

          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs bg-transparent border-0 text-gray-600 cursor-pointer p-0 focus:ring-0"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        {task.dueDate && (
          <span className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {task.assignee && (
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-600 font-medium">
            {task.assignee.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-500">{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
}

function PriorityIndicator({ priority }: { priority: TaskPriority }) {
  const colors: Record<TaskPriority, string> = {
    LOW: 'bg-green-500',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-red-500',
  };

  return (
    <div
      className={`w-2 h-2 rounded-full ${colors[priority]}`}
      title={`${priority} priority`}
    />
  );
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
