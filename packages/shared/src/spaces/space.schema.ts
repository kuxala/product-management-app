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
