import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export { PrismaClient, TaskStatus, TaskPriority, ProjectRole } from '@prisma/client';
export type { User, Project, ProjectMember, Task } from '@prisma/client';
