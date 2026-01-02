import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { taskListsApi } from '../api/taskLists';
import { tasksApi } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Project, TaskListWithTasks, Task, UpdateTaskDto } from '@pm/shared';
import { getError } from '../api/client';
import { LoadingSpinner, ErrorAlert } from '../components/shared';
import { ViewContainer } from '../components/views/ViewContainer';
import { ProjectHeader, TaskListBar } from './components';

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

  const isOwner = project?.ownerId === user?.id;

  // Flatten all tasks from task lists
  const allTasks = useMemo(() => {
    return taskLists.flatMap((list) => list.tasks);
  }, [taskLists]);

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

  const handleTaskCreate = async (listId: string, data: { title: string }) => {
    try {
      const task = await tasksApi.createInList(listId, { title: data.title });
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
    } catch (err) {
      setError(getError(err));
    }
  };

  const handleTaskUpdate = async (taskId: string, data: Partial<Task>) => {
    try {
      const updateData: UpdateTaskDto = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;

      await tasksApi.update(taskId, updateData);
      setTaskLists(
        taskLists.map((list) => ({
          ...list,
          tasks: list.tasks.map((task) =>
            task.id === taskId ? { ...task, ...data } : task
          ),
        }))
      );
    } catch (err) {
      setError(getError(err));
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await tasksApi.delete(taskId);
      setTaskLists(
        taskLists.map((list) => ({
          ...list,
          tasks: list.tasks.filter((t) => t.id !== taskId),
          taskCount: list.tasks.some((t) => t.id === taskId)
            ? list.taskCount - 1
            : list.taskCount,
        }))
      );
    } catch (err) {
      setError(getError(err));
    }
  };

  const handleTaskMove = async (taskId: string, listId: string, position: number) => {
    // Find the task and its current list
    let movedTask: Task | undefined;
    let sourceListId: string | undefined;

    for (const list of taskLists) {
      const task = list.tasks.find((t) => t.id === taskId);
      if (task) {
        movedTask = task;
        sourceListId = list.id;
        break;
      }
    }

    if (!movedTask || !sourceListId) return;

    // Optimistic update
    setTaskLists((lists) =>
      lists.map((list) => {
        if (list.id === sourceListId) {
          return {
            ...list,
            tasks: list.tasks.filter((t) => t.id !== taskId),
            taskCount: list.taskCount - 1,
          };
        }
        if (list.id === listId) {
          const newTasks = [...list.tasks];
          newTasks.splice(position, 0, { ...movedTask!, taskListId: listId });
          return {
            ...list,
            tasks: newTasks,
            taskCount: list.taskCount + 1,
          };
        }
        return list;
      })
    );

    try {
      await tasksApi.move(taskId, { taskListId: listId, position });
    } catch (err) {
      setError(getError(err));
      // Revert on error
      loadProject();
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

  if (isLoading) {
    return <LoadingSpinner />;
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
      <ProjectHeader
        name={project.name}
        description={project.description}
        memberCount={project.members.length}
        isOwner={isOwner}
        onDelete={deleteProject}
        showAddList={showAddList}
        onToggleAddList={() => setShowAddList(!showAddList)}
        newListName={newListName}
        onNewListNameChange={setNewListName}
        onCreateList={createTaskList}
      />

      {error && (
        <ErrorAlert
          message={error}
          onDismiss={() => setError('')}
          className="mx-6 mt-4"
        />
      )}

      <TaskListBar
        taskLists={taskLists}
        isOwner={isOwner}
        onDeleteList={deleteTaskList}
      />

      {/* Views Container */}
      <div className="flex-1 overflow-hidden p-6">
        {projectId && user && (
          <ViewContainer
            projectId={projectId}
            taskLists={taskLists}
            tasks={allTasks}
            currentUserId={user.id}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
            onTaskDelete={handleTaskDelete}
            onTaskMove={handleTaskMove}
          />
        )}
      </div>
    </div>
  );
}
