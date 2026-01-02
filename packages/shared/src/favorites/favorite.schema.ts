import { FavoriteType } from '../enums/enums.schema';
import { Workspace } from '../workspaces/workspace.schema';
import { Space } from '../spaces/space.schema';
import { Project } from '../projects/project.schema';
import { TaskList } from '../task-lists/task-list.schema';
import { Task } from '../tasks/task.schema';

export interface Favorite {
  id: string;
  userId: string;
  targetType: FavoriteType;
  targetId: string;
  position: number;
  createdAt: string;
}

export interface FavoriteWithTarget extends Favorite {
  target: Workspace | Space | Project | TaskList | Task;
}

export interface CreateFavoriteDto {
  targetType: FavoriteType;
  targetId: string;
}

export interface ReorderFavoritesDto {
  favoriteIds: string[];
}

export interface RecentItem {
  id: string;
  userId: string;
  targetType: FavoriteType;
  targetId: string;
  viewedAt: string;
}

export interface RecentItemWithTarget extends RecentItem {
  target: Workspace | Space | Project | TaskList | Task;
}

export interface RecordViewDto {
  targetType: FavoriteType;
  targetId: string;
}
