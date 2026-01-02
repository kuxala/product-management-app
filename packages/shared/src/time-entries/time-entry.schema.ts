import { UserSummary } from '../users/user.schema';
import { TaskSummary } from '../tasks/task.schema';

export interface TimeEntry {
  id: string;
  taskId: string;
  task?: TaskSummary;
  userId: string;
  user: UserSummary;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  billable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeEntryDto {
  taskId: string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  billable?: boolean;
}

export interface UpdateTimeEntryDto {
  description?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  billable?: boolean;
}

export interface StartTimerDto {
  taskId: string;
  description?: string;
}

export interface TimeReport {
  totalMinutes: number;
  billableMinutes: number;
  entriesByDay: {
    date: string;
    minutes: number;
    entries: TimeEntry[];
  }[];
  entriesByTask: {
    task: TaskSummary;
    minutes: number;
  }[];
  entriesByUser: {
    user: UserSummary;
    minutes: number;
  }[];
}
