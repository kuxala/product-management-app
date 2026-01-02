import { Task } from '../tasks/task.schema';

export interface TaskList {
  id: string;
  name: string;
  position: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskListWithTasks extends TaskList {
  tasks: Task[];
  taskCount: number;
}

export interface CreateTaskListDto {
  name: string;
  position?: number;
}

export interface UpdateTaskListDto {
  name?: string;
}

export interface ReorderTaskListDto {
  position: number;
}
