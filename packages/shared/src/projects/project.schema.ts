import { ProjectRole } from '../enums/enums.schema';
import { UserSummary } from '../users/user.schema';
import { Space } from '../spaces/space.schema';

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
