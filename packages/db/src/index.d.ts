import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;

// Export PrismaClient and enums
export {
  PrismaClient,
  TaskStatus,
  TaskPriority,
  ProjectRole,
  WorkspaceRole,
  FavoriteType,
} from '@prisma/client';

// Export model types
export type {
  User,
  Workspace,
  WorkspaceMember,
  Space,
  Project,
  ProjectMember,
  TaskList,
  Task,
  Favorite,
  RecentItem,
} from '@prisma/client';
