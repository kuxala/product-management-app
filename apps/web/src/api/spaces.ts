import { api } from './client';
import {
  SpaceWithProjectCount,
  CreateSpaceDto,
  UpdateSpaceDto,
} from '@pm/shared';

export const spacesApi = {
  getAllInWorkspace: (workspaceId: string) =>
    api.get<SpaceWithProjectCount[]>(`/workspaces/${workspaceId}/spaces`).then((r) => r.data),

  getById: (id: string) =>
    api.get<SpaceWithProjectCount>(`/spaces/${id}`).then((r) => r.data),

  create: (workspaceId: string, data: CreateSpaceDto) =>
    api.post<SpaceWithProjectCount>(`/workspaces/${workspaceId}/spaces`, data).then((r) => r.data),

  update: (id: string, data: UpdateSpaceDto) =>
    api.patch<SpaceWithProjectCount>(`/spaces/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/spaces/${id}`).then((r) => r.data),
};
