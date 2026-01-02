import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { projectsApi } from '../api/projects';
import { taskListsApi } from '../api/taskLists';
import { tasksApi } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Project, TaskListWithTasks, Task } from '@pm/shared';
import { getError } from '../api/client';

interface SortableTaskCardProps {
  task: Task;
  listId: string;
  onDelete: (taskId: string, listId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

function SortableTaskCard({
  task,
  listId,
  onDelete,
  onStatusChange,
  getStatusColor,
  getPriorityColor,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task, listId } });

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
      className={`bg-white p-3 rounded-lg shadow-sm hover:shadow transition cursor-grab active:cursor-grabbing ${
        isDragging ? 'ring-2 ring-indigo-500' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id, listId);
          }}
          className="p-1 hover:bg-gray-100 rounded opacity-0 hover:opacity-100 transition"
        >
          <svg
            className="w-4 h-4 text-gray-400"
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
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <select
          value={task.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(task.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`px-2 py-1 text-xs font-medium rounded cursor-pointer ${getStatusColor(task.status)}`}
        >
          <option value="TODO">TODO</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="DONE">DONE</option>
        </select>
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}
        >
          {task.priority}
        </span>
      </div>
      {task.assignee && (
        <div className="mt-2 flex items-center gap-1">
          <div className="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium">
            {task.assignee.name.charAt(0)}
          </div>
          <span className="text-xs text-gray-500">{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
}

interface TaskCardOverlayProps {
  task: Task;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

function TaskCardOverlay({
  task,
  getStatusColor,
  getPriorityColor,
}: TaskCardOverlayProps) {
  return (
    <div className="bg-white p-3 rounded-lg shadow-lg ring-2 ring-indigo-500 cursor-grabbing w-72">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
      </div>
      {task.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}
        >
          {task.status}
        </span>
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}
        >
          {task.priority}
        </span>
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [taskLists, setTaskLists] = useState<TaskListWithTasks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [addingTaskToList, setAddingTaskToList] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const isOwner = project?.ownerId === user?.id;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      const projectData = await projectsApi.getById(projectId);
      setProject(projectData);

      const listsData = await taskListsApi.getAllInProject(projectId);
      setTaskLists(listsData);
    } catch (err) {
      setError(getError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const createTaskList = async () => {
    if (!projectId || !newListName.trim()) return;

    try {
      const list = await taskListsApi.create(projectId, { name: newListName });
      setTaskLists([...taskLists, { ...list, tasks: [], taskCount: 0 }]);
      setNewListName('');
      setShowAddList(false);
    } catch (err) {
      setError(getError(err));
    }
  };

  const createTask = async (listId: string) => {
    if (!newTaskTitle.trim()) return;

    try {
      const task = await tasksApi.createInList(listId, { title: newTaskTitle });
      setTaskLists(
        taskLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                tasks: [...list.tasks, task],
                taskCount: list.taskCount + 1,
              }
            : list
        )
      );
      setNewTaskTitle('');
      setAddingTaskToList(null);
    } catch (err) {
      setError(getError(err));
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await tasksApi.update(taskId, { status: status as Task['status'] });
      setTaskLists(
        taskLists.map((list) => ({
          ...list,
          tasks: list.tasks.map((task) =>
            task.id === taskId
              ? { ...task, status: status as Task['status'] }
              : task
          ),
        }))
      );
    } catch (err) {
      setError(getError(err));
    }
  };

  const deleteTask = async (taskId: string, listId: string) => {
    try {
      await tasksApi.delete(taskId);
      setTaskLists(
        taskLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                tasks: list.tasks.filter((t) => t.id !== taskId),
                taskCount: list.taskCount - 1,
              }
            : list
        )
      );
    } catch (err) {
      setError(getError(err));
    }
  };

  const deleteTaskList = async (listId: string) => {
    if (!confirm('Delete this list and all its tasks?')) return;

    try {
      await taskListsApi.delete(listId);
      setTaskLists(taskLists.filter((l) => l.id !== listId));
    } catch (err) {
      setError(getError(err));
    }
  };

  const deleteProject = async () => {
    if (!projectId || !confirm('Delete this project and all its data?')) return;

    try {
      await projectsApi.delete(projectId);
      navigate(`/w/${currentWorkspace?.slug}`);
    } catch (err) {
      setError(getError(err));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'DONE':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-700';
      case 'LOW':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const findListContainingTask = useCallback(
    (taskId: string): string | null => {
      for (const list of taskLists) {
        if (list.tasks.some((t) => t.id === taskId)) {
          return list.id;
        }
      }
      return null;
    },
    [taskLists]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current as
      | { type: string; task: Task }
      | undefined;

    if (activeData?.type === 'task') {
      setActiveTask(activeData.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeListId = findListContainingTask(activeId);
    let overListId = findListContainingTask(overId);

    // If overId is a list id, use it directly
    if (!overListId && taskLists.some((l) => l.id === overId)) {
      overListId = overId;
    }

    if (!activeListId || !overListId || activeListId === overListId) return;

    setTaskLists((lists) => {
      const activeList = lists.find((l) => l.id === activeListId);
      const overList = lists.find((l) => l.id === overListId);

      if (!activeList || !overList) return lists;

      const activeTaskIndex = activeList.tasks.findIndex(
        (t) => t.id === activeId
      );
      const task = activeList.tasks[activeTaskIndex];

      if (!task) return lists;

      // Find the position in the over list
      const overTaskIndex = overList.tasks.findIndex((t) => t.id === overId);
      const insertIndex =
        overTaskIndex >= 0 ? overTaskIndex : overList.tasks.length;

      return lists.map((list) => {
        if (list.id === activeListId) {
          return {
            ...list,
            tasks: list.tasks.filter((t) => t.id !== activeId),
            taskCount: list.taskCount - 1,
          };
        }
        if (list.id === overListId) {
          const newTasks = [...list.tasks];
          newTasks.splice(insertIndex, 0, task);
          return {
            ...list,
            tasks: newTasks,
            taskCount: list.taskCount + 1,
          };
        }
        return list;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeListId = findListContainingTask(activeId);
    let overListId = findListContainingTask(overId);

    // If overId is a list id, use it directly
    if (!overListId && taskLists.some((l) => l.id === overId)) {
      overListId = overId;
    }

    if (!activeListId || !overListId) return;

    const activeList = taskLists.find((l) => l.id === activeListId);
    if (!activeList) return;

    const activeIndex = activeList.tasks.findIndex((t) => t.id === activeId);

    if (activeListId === overListId) {
      // Reordering within the same list
      const overIndex = activeList.tasks.findIndex((t) => t.id === overId);

      if (activeIndex !== overIndex && overIndex >= 0) {
        setTaskLists((lists) =>
          lists.map((list) => {
            if (list.id === activeListId) {
              return {
                ...list,
                tasks: arrayMove(list.tasks, activeIndex, overIndex),
              };
            }
            return list;
          })
        );

        // Call API to persist reorder
        try {
          await tasksApi.reorder(activeId, { position: overIndex });
        } catch (err) {
          setError(getError(err));
          // Revert on error
          loadProject();
        }
      }
    } else {
      // Moving to a different list
      const overList = taskLists.find((l) => l.id === overListId);
      if (!overList) return;

      const overIndex = overList.tasks.findIndex((t) => t.id === overId);
      const position = overIndex >= 0 ? overIndex : overList.tasks.length;

      // Call API to persist move
      try {
        await tasksApi.move(activeId, {
          taskListId: overListId,
          position,
        });
      } catch (err) {
        setError(getError(err));
        // Revert on error
        loadProject();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
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
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-500">{project.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Members ({project.members.length})
            </button>
            {isOwner && (
              <button
                onClick={deleteProject}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {taskLists.map((list) => (
              <div
                key={list.id}
                className="w-80 flex-shrink-0 bg-gray-100 rounded-xl flex flex-col"
              >
                {/* List Header */}
                <div className="p-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{list.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">
                      {list.taskCount}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => deleteTaskList(list.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <svg
                          className="w-4 h-4 text-gray-400"
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
                </div>

                {/* Tasks */}
                <SortableContext
                  items={list.tasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-[100px]"
                    data-list-id={list.id}
                  >
                    {list.tasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        listId={list.id}
                        onDelete={deleteTask}
                        onStatusChange={updateTaskStatus}
                        getStatusColor={getStatusColor}
                        getPriorityColor={getPriorityColor}
                      />
                    ))}

                    {/* Add Task */}
                    {addingTaskToList === list.id ? (
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Task title"
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') createTask(list.id);
                            if (e.key === 'Escape') {
                              setAddingTaskToList(null);
                              setNewTaskTitle('');
                            }
                          }}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => createTask(list.id)}
                            className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setAddingTaskToList(null);
                              setNewTaskTitle('');
                            }}
                            className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingTaskToList(list.id)}
                        className="w-full p-2 text-sm text-gray-500 hover:bg-white hover:text-gray-700 rounded-lg transition text-left"
                      >
                        + Add task
                      </button>
                    )}
                  </div>
                </SortableContext>
              </div>
            ))}

            {/* Add List */}
            <div className="w-80 flex-shrink-0">
              {showAddList ? (
                <div className="bg-gray-100 rounded-xl p-3">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createTaskList();
                      if (e.key === 'Escape') {
                        setShowAddList(false);
                        setNewListName('');
                      }
                    }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={createTaskList}
                      className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Add List
                    </button>
                    <button
                      onClick={() => {
                        setShowAddList(false);
                        setNewListName('');
                      }}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-white rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddList(true)}
                  className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition text-left"
                >
                  + Add list
                </button>
              )}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCardOverlay
                task={activeTask}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
