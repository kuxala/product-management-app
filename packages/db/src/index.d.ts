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
  CustomFieldType,
  DependencyType,
  ViewType,
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
  Label,
  TaskLabel,
  CustomField,
  CustomFieldValue,
  Comment,
  Reaction,
  Attachment,
  TimeEntry,
  TaskDependency,
  Checklist,
  ChecklistItem,
  SavedView,
  SavedFilter,
} from '@prisma/client';

// Export Prisma namespace for JsonValue type
export { Prisma } from '@prisma/client';
