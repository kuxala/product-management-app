import { DependencyType } from '../enums/enums.schema';
import { TaskSummary } from '../tasks/task.schema';

export interface TaskDependency {
  id: string;
  dependentTaskId: string;
  dependentTask: TaskSummary;
  dependsOnTaskId: string;
  dependsOnTask: TaskSummary;
  type: DependencyType;
  isBlocked: boolean;
  createdAt: string;
}

export interface CreateDependencyDto {
  dependsOnTaskId: string;
  type?: DependencyType;
}
