import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaClient } from '@pm/db';
import { CreateProjectDto, UpdateProjectDto } from '@pm/shared';

const ownerSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
};

const memberInclude = {
  user: { select: ownerSelect },
};

const projectInclude = {
  owner: { select: ownerSelect },
  members: { include: memberInclude },
  space: true,
  _count: { select: { tasks: true, taskLists: true } },
};

const projectWithTaskListsInclude = {
  ...projectInclude,
  taskLists: {
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: { position: 'asc' as const },
  },
};

@Injectable()
export class ProjectsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
          { space: { workspace: { members: { some: { userId } } } } },
        ],
      },
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return projects;
  }

  async findAllInSpace(spaceId: string, userId: string) {
    // Verify user has access to the space's workspace
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        workspace: {
          include: { members: { where: { userId } } },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (!space.workspace.members.length) {
      throw new ForbiddenException('Access denied');
    }

    const projects = await this.prisma.project.findMany({
      where: { spaceId },
      include: projectInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return projects;
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: projectWithTaskListsInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      ...project,
      taskLists: project.taskLists.map((list) => ({
        ...list,
        taskCount: list._count.tasks,
      })),
    };
  }

  async create(userId: string, spaceId: string, data: CreateProjectDto) {
    // Verify user has access to the space's workspace
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        workspace: {
          include: { members: { where: { userId } } },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    if (!space.workspace.members.length) {
      throw new ForbiddenException('Access denied');
    }

    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: userId,
        spaceId,
        members: {
          create: { userId, role: 'OWNER' },
        },
        // Create a default task list
        taskLists: {
          create: { name: 'Tasks', position: 0 },
        },
      },
      include: projectWithTaskListsInclude,
    });

    return {
      ...project,
      taskLists: project.taskLists.map((list) => ({
        ...list,
        taskCount: list._count.tasks,
      })),
    };
  }

  async update(id: string, data: UpdateProjectDto) {
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: projectInclude,
    });

    return project;
  }

  async delete(id: string) {
    // Cascading delete should handle related records
    await this.prisma.project.delete({ where: { id } });
  }

  async addMember(projectId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existing = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.id, projectId } },
    });

    if (existing) {
      throw new ForbiddenException('User is already a member');
    }

    const member = await this.prisma.projectMember.create({
      data: { userId: user.id, projectId, role: 'MEMBER' },
      include: memberInclude,
    });

    return member;
  }

  async removeMember(projectId: string, userId: string) {
    // Check if trying to remove owner
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (project?.ownerId === userId) {
      throw new ForbiddenException('Cannot remove project owner');
    }

    await this.prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });
  }

  async getMembers(projectId: string) {
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: memberInclude,
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    return members;
  }
}
