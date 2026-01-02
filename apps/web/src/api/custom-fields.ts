import { api } from './client';
import {
  CustomField,
  CustomFieldValue,
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
  SetCustomFieldValueDto,
} from '@pm/shared';

export const customFieldsApi = {
  // Space-level custom fields
  getBySpace: (spaceId: string) =>
    api.get<CustomField[]>(`/spaces/${spaceId}/custom-fields`).then((r) => r.data),

  createForSpace: (spaceId: string, data: CreateCustomFieldDto) =>
    api.post<CustomField>(`/spaces/${spaceId}/custom-fields`, data).then((r) => r.data),

  // Project-level custom fields
  getByProject: (projectId: string) =>
    api.get<CustomField[]>(`/projects/${projectId}/custom-fields`).then((r) => r.data),

  createForProject: (projectId: string, data: CreateCustomFieldDto) =>
    api.post<CustomField>(`/projects/${projectId}/custom-fields`, data).then((r) => r.data),

  // Custom field management
  update: (fieldId: string, data: UpdateCustomFieldDto) =>
    api.patch<CustomField>(`/custom-fields/${fieldId}`, data).then((r) => r.data),

  delete: (fieldId: string) =>
    api.delete(`/custom-fields/${fieldId}`).then((r) => r.data),

  // Task field values
  getTaskFieldValues: (taskId: string) =>
    api.get<CustomFieldValue[]>(`/tasks/${taskId}/custom-fields`).then((r) => r.data),

  setTaskFieldValue: (taskId: string, fieldId: string, data: SetCustomFieldValueDto) =>
    api.put<CustomFieldValue>(`/tasks/${taskId}/custom-fields/${fieldId}`, data).then((r) => r.data),

  clearTaskFieldValue: (taskId: string, fieldId: string) =>
    api.delete(`/tasks/${taskId}/custom-fields/${fieldId}`).then((r) => r.data),
};
