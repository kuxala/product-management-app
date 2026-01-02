import { api } from './client';
import {
  Checklist,
  ChecklistItem,
  CreateChecklistDto,
  UpdateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  ReorderChecklistItemsDto,
} from '@pm/shared';

export const checklistsApi = {
  getByTask: (taskId: string) =>
    api.get<Checklist[]>(`/tasks/${taskId}/checklists`).then((r) => r.data),

  create: (taskId: string, data: CreateChecklistDto) =>
    api.post<Checklist>(`/tasks/${taskId}/checklists`, data).then((r) => r.data),

  update: (checklistId: string, data: UpdateChecklistDto) =>
    api.patch<Checklist>(`/checklists/${checklistId}`, data).then((r) => r.data),

  delete: (checklistId: string) =>
    api.delete(`/checklists/${checklistId}`).then((r) => r.data),

  addItem: (checklistId: string, data: CreateChecklistItemDto) =>
    api.post<ChecklistItem>(`/checklists/${checklistId}/items`, data).then((r) => r.data),

  updateItem: (itemId: string, data: UpdateChecklistItemDto) =>
    api.patch<ChecklistItem>(`/checklist-items/${itemId}`, data).then((r) => r.data),

  deleteItem: (itemId: string) =>
    api.delete(`/checklist-items/${itemId}`).then((r) => r.data),

  reorderItems: (checklistId: string, data: ReorderChecklistItemsDto) =>
    api.patch<Checklist>(`/checklists/${checklistId}/reorder`, data).then((r) => r.data),
};
