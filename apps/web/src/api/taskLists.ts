import { api } from './client';
import {
  TaskListWithTasks,
  CreateTaskListDto,
  UpdateTaskListDto,
  ReorderTaskListDto,
} from '@pm/shared';

export const taskListsApi = {
  getAllInProject: (projectId: string) =>
    api.get<TaskListWithTasks[]>(`/projects/${projectId}/lists`).then((r) => r.data),

  getById: (id: string) =>
    api.get<TaskListWithTasks>(`/lists/${id}`).then((r) => r.data),

  create: (projectId: string, data: CreateTaskListDto) =>
    api.post<TaskListWithTasks>(`/projects/${projectId}/lists`, data).then((r) => r.data),

  update: (id: string, data: UpdateTaskListDto) =>
    api.patch<TaskListWithTasks>(`/lists/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/lists/${id}`).then((r) => r.data),

  reorder: (id: string, data: ReorderTaskListDto) =>
    api.patch<TaskListWithTasks>(`/lists/${id}/reorder`, data).then((r) => r.data),
};
