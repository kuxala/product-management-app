// ============================================
// ENUMS
// ============================================

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ProjectRole = 'OWNER' | 'MEMBER';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
export type FavoriteType = 'WORKSPACE' | 'SPACE' | 'PROJECT' | 'TASK_LIST' | 'TASK';

// ============================================
// USER
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

// ============================================
// AUTH
// ============================================

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

// ============================================
// WORKSPACE
// ============================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
  memberCount: number;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: UserSummary;
}

export interface CreateWorkspaceDto {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
  logoUrl?: string;
}

export interface InviteWorkspaceMemberDto {
  email: string;
  role?: WorkspaceRole;
}

export interface UpdateWorkspaceMemberDto {
  role: WorkspaceRole;
}

// ============================================
// SPACE
// ============================================

export interface Space {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceWithProjectCount extends Space {
  projectCount: number;
}

export interface CreateSpaceDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateSpaceDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

// ============================================
// PROJECT
// ============================================

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  joinedAt: string;
  user: UserSummary;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  spaceId: string;
  ownerId: string;
  owner: UserSummary;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
  _count: {
    tasks: number;
    taskLists: number;
  };
}

export interface ProjectWithSpace extends Project {
  space: Space;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export interface AddMemberDto {
  email: string;
}

// ============================================
// TASK LIST
// ============================================

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

// ============================================
// TASK
// ============================================

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
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithSubtasks extends Task {
  subtasks: Task[];
  subtaskCount: number;
  completedSubtaskCount: number;
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

// ============================================
// FAVORITES
// ============================================

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

// ============================================
// RECENT ITEMS
// ============================================

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
