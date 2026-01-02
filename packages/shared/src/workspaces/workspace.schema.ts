import { WorkspaceRole } from '../enums/enums.schema';
import { UserSummary } from '../users/user.schema';

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
