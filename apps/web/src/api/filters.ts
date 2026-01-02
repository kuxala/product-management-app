import { api } from './client';
import { SavedFilter, CreateFilterDto, UpdateFilterDto } from '@pm/shared';

export const filtersApi = {
  // Filters in a project
  getByProject: (projectId: string) =>
    api.get<SavedFilter[]>(`/projects/${projectId}/filters`).then((r) => r.data),

  createForProject: (projectId: string, data: CreateFilterDto) =>
    api.post<SavedFilter>(`/projects/${projectId}/filters`, data).then((r) => r.data),

  // Filters in a space
  getBySpace: (spaceId: string) =>
    api.get<SavedFilter[]>(`/spaces/${spaceId}/filters`).then((r) => r.data),

  createForSpace: (spaceId: string, data: CreateFilterDto) =>
    api.post<SavedFilter>(`/spaces/${spaceId}/filters`, data).then((r) => r.data),

  // Single filter operations
  getById: (filterId: string) =>
    api.get<SavedFilter>(`/filters/${filterId}`).then((r) => r.data),

  update: (filterId: string, data: UpdateFilterDto) =>
    api.patch<SavedFilter>(`/filters/${filterId}`, data).then((r) => r.data),

  delete: (filterId: string) =>
    api.delete(`/filters/${filterId}`).then((r) => r.data),
};
