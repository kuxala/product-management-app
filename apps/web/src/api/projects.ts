import { api } from './client';
import { Project, CreateProjectDto, UpdateProjectDto, AddMemberDto, ProjectMember } from '@pm/shared';

export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects').then(r => r.data),
  getById: (id: string) => api.get<Project>(`/projects/${id}`).then(r => r.data),
  create: (d: CreateProjectDto) => api.post<Project>('/projects', d).then(r => r.data),
  update: (id: string, d: UpdateProjectDto) => api.patch<Project>(`/projects/${id}`, d).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addMember: (id: string, d: AddMemberDto) => api.post<ProjectMember>(`/projects/${id}/members`, d).then(r => r.data),
  removeMember: (id: string, uid: string) => api.delete(`/projects/${id}/members/${uid}`),
};
