import { api } from './client';
import { TaskDependency, CreateDependencyDto } from '@pm/shared';

export const dependenciesApi = {
  getByTask: (taskId: string) =>
    api.get<TaskDependency[]>(`/tasks/${taskId}/dependencies`).then((r) => r.data),

  create: (taskId: string, data: CreateDependencyDto) =>
    api.post<TaskDependency>(`/tasks/${taskId}/dependencies`, data).then((r) => r.data),

  delete: (dependencyId: string) =>
    api.delete(`/dependencies/${dependencyId}`).then((r) => r.data),
};
