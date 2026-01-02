import { TaskStatus, TaskPriority } from '../enums/enums.schema';
import { UserSummary } from '../users/user.schema';
import { TaskLabel } from '../labels/label.schema';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  projectId: string;
  taskListId: string | null;
  assigneeId: string | null;
  assignee: UserSummary | null;
  parentId: string | null;
  dueDate: string | null;
  startDate: string | null;
  estimate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface TaskWithSubtasks extends Task {
  subtasks: Task[];
  subtaskCount: number;
  completedSubtaskCount: number;
}

export interface TaskWithRichData extends Task {
  subtasks: Task[];
  subtaskCount: number;
  completedSubtaskCount: number;
  labels: TaskLabel[];
  commentCount: number;
  attachmentCount: number;
  checklistProgress: number | null;
  isBlocked: boolean;
  totalTimeSpent: number;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  position?: number;
}

export interface CreateSubtaskDto {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  estimate?: number | null;
  position?: number;
}

export interface MoveTaskDto {
  taskListId: string;
  position?: number;
}

export interface ReorderTaskDto {
  position: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  taskListId?: string;
  parentId?: string | null;
}
