import { WorkspaceRole, InvitationStatus } from '../enums/enums.schema';
import { UserSummary } from '../users/user.schema';

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
}

export interface Invitation {
  id: string;
  email: string;
  workspaceId: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  invitedById: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: UserSummary;
  workspace?: WorkspaceSummary;
}

export interface CreateInvitationDto {
  email: string;
  role?: WorkspaceRole;
}

export interface AcceptInvitationResult {
  message: string;
  workspaceId: string;
}
