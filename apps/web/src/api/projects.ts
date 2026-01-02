import { api } from './client';
import {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  AddMemberDto,
  ProjectMember,
} from '@pm/shared';

export const projectsApi = {
  getAll: () =>
    api.get<Project[]>('/projects').then((r) => r.data),

  getAllInSpace: (spaceId: string) =>
    api.get<Project[]>(`/spaces/${spaceId}/projects`).then((r) => r.data),

  getById: (id: string) =>
    api.get<Project>(`/projects/${id}`).then((r) => r.data),

  create: (spaceId: string, data: CreateProjectDto) =>
    api.post<Project>(`/spaces/${spaceId}/projects`, data).then((r) => r.data),

  update: (id: string, data: UpdateProjectDto) =>
    api.patch<Project>(`/projects/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/projects/${id}`).then((r) => r.data),

  getMembers: (id: string) =>
    api.get<ProjectMember[]>(`/projects/${id}/members`).then((r) => r.data),

  addMember: (id: string, data: AddMemberDto) =>
    api.post<ProjectMember>(`/projects/${id}/members`, data).then((r) => r.data),

  removeMember: (id: string, userId: string) =>
    api.delete(`/projects/${id}/members/${userId}`).then((r) => r.data),
};
