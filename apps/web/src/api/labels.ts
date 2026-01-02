import { api } from './client';
import {
  Label,
  LabelWithTaskCount,
  TaskLabel,
  CreateLabelDto,
  UpdateLabelDto,
} from '@pm/shared';

export const labelsApi = {
  // Space-level labels
  getBySpace: (spaceId: string) =>
    api.get<LabelWithTaskCount[]>(`/spaces/${spaceId}/labels`).then((r) => r.data),

  createForSpace: (spaceId: string, data: CreateLabelDto) =>
    api.post<Label>(`/spaces/${spaceId}/labels`, data).then((r) => r.data),

  // Project-level labels
  getByProject: (projectId: string) =>
    api.get<LabelWithTaskCount[]>(`/projects/${projectId}/labels`).then((r) => r.data),

  createForProject: (projectId: string, data: CreateLabelDto) =>
    api.post<Label>(`/projects/${projectId}/labels`, data).then((r) => r.data),

  // Label management
  update: (labelId: string, data: UpdateLabelDto) =>
    api.patch<Label>(`/labels/${labelId}`, data).then((r) => r.data),

  delete: (labelId: string) =>
    api.delete(`/labels/${labelId}`).then((r) => r.data),

  // Task-label management
  getTaskLabels: (taskId: string) =>
    api.get<TaskLabel[]>(`/tasks/${taskId}/labels`).then((r) => r.data),

  addToTask: (taskId: string, labelId: string) =>
    api.post<TaskLabel>(`/tasks/${taskId}/labels/${labelId}`).then((r) => r.data),

  removeFromTask: (taskId: string, labelId: string) =>
    api.delete(`/tasks/${taskId}/labels/${labelId}`).then((r) => r.data),
};
