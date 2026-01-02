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

// Basic task filters (backwards compatible)
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  taskListId?: string;
  parentId?: string | null;
}

// Advanced task filters for complex queries
export interface AdvancedTaskFilters extends TaskFilters {
  // Multiple value filters
  statuses?: TaskStatus[];
  priorities?: TaskPriority[];
  assigneeIds?: string[];
  taskListIds?: string[];
  labelIds?: string[];

  // Date range filters
  dueDateFrom?: string;
  dueDateTo?: string;
  startDateFrom?: string;
  startDateTo?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;

  // Boolean filters
  hasSubtasks?: boolean;
  hasDueDate?: boolean;
  hasAssignee?: boolean;
  isOverdue?: boolean;
  isBlocked?: boolean;

  // Text search
  search?: string;

  // Sorting
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';

  // Pagination
  limit?: number;
  offset?: number;
}

// Task query result with pagination info
export interface TaskQueryResult {
  tasks: Task[];
  total: number;
  hasMore: boolean;
  page: number;
  totalPages: number;
}

// Task grouped by a field
export interface TaskGroup {
  key: string;
  label: string;
  color?: string;
  tasks: Task[];
  count: number;
}

// Grouped task query result
export interface GroupedTaskQueryResult {
  groups: TaskGroup[];
  total: number;
}
