import { api } from './client';
import {
  SavedView,
  CreateViewDto,
  UpdateViewDto,
  ReorderViewsDto,
} from '@pm/shared';

export const viewsApi = {
  // Views in a project
  getByProject: (projectId: string) =>
    api.get<SavedView[]>(`/projects/${projectId}/views`).then((r) => r.data),

  create: (projectId: string, data: CreateViewDto) =>
    api.post<SavedView>(`/projects/${projectId}/views`, data).then((r) => r.data),

  reorder: (projectId: string, data: ReorderViewsDto) =>
    api.post(`/projects/${projectId}/views/reorder`, data).then((r) => r.data),

  // Single view operations
  getById: (viewId: string) =>
    api.get<SavedView>(`/views/${viewId}`).then((r) => r.data),

  update: (viewId: string, data: UpdateViewDto) =>
    api.patch<SavedView>(`/views/${viewId}`, data).then((r) => r.data),

  delete: (viewId: string) =>
    api.delete(`/views/${viewId}`).then((r) => r.data),

  setDefault: (viewId: string) =>
    api.patch<SavedView>(`/views/${viewId}/default`).then((r) => r.data),

  duplicate: (viewId: string) =>
    api.post<SavedView>(`/views/${viewId}/duplicate`).then((r) => r.data),
};
