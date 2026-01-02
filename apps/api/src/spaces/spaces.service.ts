import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@pm/db';
import { CreateSpaceDto, UpdateSpaceDto } from '@pm/shared';

const spaceInclude = {
  _count: {
    select: { projects: true },
  },
};

const spaceWithProjectsInclude = {
  ...spaceInclude,
  projects: {
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      _count: {
        select: { tasks: true, taskLists: true },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
};

@Injectable()
export class SpacesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAllInWorkspace(workspaceId: string) {
    const spaces = await this.prisma.space.findMany({
      where: { workspaceId },
      include: spaceInclude,
      orderBy: { createdAt: 'asc' },
    });

    return spaces.map((s) => ({
      ...s,
      projectCount: s._count.projects,
    }));
  }

  async findOne(spaceId: string, userId: string) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        ...spaceWithProjectsInclude,
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Check if user is a member of the workspace
    if (!space.workspace.members.length) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    const { workspace, ...spaceData } = space;
    return {
      ...spaceData,
      projectCount: space._count.projects,
      projects: space.projects.map((p) => ({
        ...p,
        taskCount: p._count.tasks,
        taskListCount: p._count.taskLists,
      })),
    };
  }

  async create(workspaceId: string, data: CreateSpaceDto) {
    const space = await this.prisma.space.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || '#6366f1',
        icon: data.icon,
        workspaceId,
      },
      include: spaceInclude,
    });

    return {
      ...space,
      projectCount: space._count.projects,
    };
  }

  async update(spaceId: string, userId: string, data: UpdateSpaceDto) {
    // Verify user has access to workspace
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId, role: { in: ['OWNER', 'ADMIN'] } },
            },
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (!space.workspace.members.length) {
      throw new ForbiddenException('Admin access required');
    }

    const updated = await this.prisma.space.update({
      where: { id: spaceId },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
      },
      include: spaceInclude,
    });

    return {
      ...updated,
      projectCount: updated._count.projects,
    };
  }

  async delete(spaceId: string, userId: string) {
    // Verify user has access to workspace
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId, role: { in: ['OWNER', 'ADMIN'] } },
            },
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (!space.workspace.members.length) {
      throw new ForbiddenException('Admin access required');
    }

    await this.prisma.space.delete({
      where: { id: spaceId },
    });
  }
}
