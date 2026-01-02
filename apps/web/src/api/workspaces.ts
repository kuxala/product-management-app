import { api } from './client';
import {
  WorkspaceWithRole,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
  WorkspaceMember,
} from '@pm/shared';

export const workspacesApi = {
  getAll: () =>
    api.get<WorkspaceWithRole[]>('/workspaces').then((r) => r.data),

  getById: (id: string) =>
    api.get<WorkspaceWithRole>(`/workspaces/${id}`).then((r) => r.data),

  getBySlug: (slug: string) =>
    api.get<WorkspaceWithRole>(`/workspaces/by-slug/${slug}`).then((r) => r.data),

  create: (data: CreateWorkspaceDto) =>
    api.post<WorkspaceWithRole>('/workspaces', data).then((r) => r.data),

  update: (id: string, data: UpdateWorkspaceDto) =>
    api.patch<WorkspaceWithRole>(`/workspaces/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/workspaces/${id}`).then((r) => r.data),

  getMembers: (id: string) =>
    api.get<WorkspaceMember[]>(`/workspaces/${id}/members`).then((r) => r.data),

  inviteMember: (id: string, data: InviteWorkspaceMemberDto) =>
    api.post<WorkspaceMember>(`/workspaces/${id}/members`, data).then((r) => r.data),

  updateMemberRole: (workspaceId: string, userId: string, data: UpdateWorkspaceMemberDto) =>
    api.patch<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}`, data).then((r) => r.data),

  removeMember: (workspaceId: string, userId: string) =>
    api.delete(`/workspaces/${workspaceId}/members/${userId}`).then((r) => r.data),

  leave: (id: string) =>
    api.post(`/workspaces/${id}/leave`).then((r) => r.data),
};
