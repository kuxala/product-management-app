import { UserSummary } from '../users/user.schema';

export interface ChecklistItem {
  id: string;
  content: string;
  isCompleted: boolean;
  checklistId: string;
  assigneeId: string | null;
  assignee: UserSummary | null;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Checklist {
  id: string;
  name: string;
  taskId: string;
  position: number;
  items: ChecklistItem[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChecklistDto {
  name: string;
  items?: CreateChecklistItemDto[];
}

export interface UpdateChecklistDto {
  name?: string;
}

export interface CreateChecklistItemDto {
  content: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateChecklistItemDto {
  content?: string;
  isCompleted?: boolean;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export interface ReorderChecklistItemsDto {
  itemIds: string[];
}
