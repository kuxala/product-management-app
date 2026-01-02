import { api } from './client';
import {
  Task,
  TaskWithSubtasks,
  CreateTaskDto,
  UpdateTaskDto,
  CreateSubtaskDto,
  MoveTaskDto,
  ReorderTaskDto,
  TaskFilters,
} from '@pm/shared';

export const tasksApi = {
  // Tasks in a project
  getAll: (projectId: string, filters?: TaskFilters) =>
    api.get<Task[]>(`/projects/${projectId}/tasks`, { params: filters }).then((r) => r.data),

  create: (projectId: string, data: CreateTaskDto) =>
    api.post<Task>(`/projects/${projectId}/tasks`, data).then((r) => r.data),

  // Tasks in a task list
  createInList: (listId: string, data: CreateTaskDto) =>
    api.post<Task>(`/lists/${listId}/tasks`, data).then((r) => r.data),

  // Single task operations
  getById: (taskId: string) =>
    api.get<TaskWithSubtasks>(`/tasks/${taskId}`).then((r) => r.data),

  update: (taskId: string, data: UpdateTaskDto) =>
    api.patch<Task>(`/tasks/${taskId}`, data).then((r) => r.data),

  delete: (taskId: string) =>
    api.delete(`/tasks/${taskId}`).then((r) => r.data),

  // Legacy routes (for backward compatibility during migration)
  updateInProject: (projectId: string, taskId: string, data: UpdateTaskDto) =>
    api.patch<Task>(`/projects/${projectId}/tasks/${taskId}`, data).then((r) => r.data),

  deleteInProject: (projectId: string, taskId: string) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`).then((r) => r.data),

  // Subtasks
  createSubtask: (taskId: string, data: CreateSubtaskDto) =>
    api.post<Task>(`/tasks/${taskId}/subtasks`, data).then((r) => r.data),

  // Move task to different list
  move: (taskId: string, data: MoveTaskDto) =>
    api.patch<Task>(`/tasks/${taskId}/move`, data).then((r) => r.data),

  // Reorder task position
  reorder: (taskId: string, data: ReorderTaskDto) =>
    api.patch<Task>(`/tasks/${taskId}/reorder`, data).then((r) => r.data),
};
