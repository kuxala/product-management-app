import { api } from './client';
import { Task, CreateTaskDto, UpdateTaskDto, TaskFilters } from '@pm/shared';

export const tasksApi = {
  getAll: (pid: string, filters?: TaskFilters) => api.get<Task[]>(`/projects/${pid}/tasks`, { params: filters }).then(r => r.data),
  create: (pid: string, d: CreateTaskDto) => api.post<Task>(`/projects/${pid}/tasks`, d).then(r => r.data),
  update: (pid: string, tid: string, d: UpdateTaskDto) => api.patch<Task>(`/projects/${pid}/tasks/${tid}`, d).then(r => r.data),
  delete: (pid: string, tid: string) => api.delete(`/projects/${pid}/tasks/${tid}`),
};
