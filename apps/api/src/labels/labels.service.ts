import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient } from '@pm/db';
import { CreateLabelDto, UpdateLabelDto } from '@pm/shared';

@Injectable()
export class LabelsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findBySpace(spaceId: string, userId: string) {
    // Verify space exists and user has access
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

    if (space.workspace.members.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    const labels = await this.prisma.label.findMany({
      where: { spaceId },
      include: {
        _count: { select: { tasks: true } },
      },
      orderBy: { name: 'asc' },
    });

    return labels.map((label) => ({
      ...label,
      taskCount: label._count.tasks,
      _count: undefined,
    }));
  }

  async findByProject(projectId: string) {
    const labels = await this.prisma.label.findMany({
      where: { projectId },
      include: {
        _count: { select: { tasks: true } },
      },
      orderBy: { name: 'asc' },
    });

    return labels.map((label) => ({
      ...label,
      taskCount: label._count.tasks,
      _count: undefined,
    }));
  }

  async createForSpace(spaceId: string, userId: string, data: CreateLabelDto) {
    // Verify space exists and user has admin access
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

    if (space.workspace.members.length === 0) {
      throw new ForbiddenException('Access denied');
    }

    const member = space.workspace.members[0];
    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('Admin access required');
    }

    return this.prisma.label.create({
      data: {
        name: data.name,
        color: data.color,
        spaceId,
      },
    });
  }

  async createForProject(projectId: string, data: CreateLabelDto) {
    return this.prisma.label.create({
      data: {
        name: data.name,
        color: data.color,
        projectId,
      },
    });
  }

  async update(labelId: string, userId: string, data: UpdateLabelDto) {
    const label = await this.findLabelWithAccess(labelId, userId);

    return this.prisma.label.update({
      where: { id: labelId },
      data: {
        name: data.name,
        color: data.color,
      },
    });
  }

  async delete(labelId: string, userId: string) {
    await this.findLabelWithAccess(labelId, userId);
    return this.prisma.label.delete({ where: { id: labelId } });
  }

  async addToTask(taskId: string, labelId: string, userId: string) {
    // Verify task exists and user has access
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId } } },
                },
              },
            },
            members: { where: { userId } },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isWorkspaceMember = task.project.space.workspace.members.length > 0;
    const isProjectMember =
      task.project.members.length > 0 || task.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    // Verify label exists and belongs to the same project or space
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Label must be from same project or from the space
    if (label.projectId && label.projectId !== task.projectId) {
      throw new ForbiddenException('Label does not belong to this project');
    }
    if (label.spaceId && label.spaceId !== task.project.spaceId) {
      throw new ForbiddenException('Label does not belong to this space');
    }

    // Check if already assigned
    const existing = await this.prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: { taskId, labelId },
      },
    });

    if (existing) {
      throw new ConflictException('Label already assigned to task');
    }

    return this.prisma.taskLabel.create({
      data: { taskId, labelId },
      include: { label: true },
    });
  }

  async removeFromTask(taskId: string, labelId: string, userId: string) {
    // Verify task exists and user has access
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId } } },
                },
              },
            },
            members: { where: { userId } },
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isWorkspaceMember = task.project.space.workspace.members.length > 0;
    const isProjectMember =
      task.project.members.length > 0 || task.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    const taskLabel = await this.prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: { taskId, labelId },
      },
    });

    if (!taskLabel) {
      throw new NotFoundException('Label not assigned to this task');
    }

    return this.prisma.taskLabel.delete({
      where: { id: taskLabel.id },
    });
  }

  async getTaskLabels(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId } } },
                },
              },
            },
            members: { where: { userId } },
          },
        },
        labels: {
          include: { label: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isWorkspaceMember = task.project.space.workspace.members.length > 0;
    const isProjectMember =
      task.project.members.length > 0 || task.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    return task.labels;
  }

  private async findLabelWithAccess(labelId: string, userId: string) {
    const label = await this.prisma.label.findUnique({
      where: { id: labelId },
      include: {
        space: {
          include: {
            workspace: {
              include: { members: { where: { userId } } },
            },
          },
        },
        project: {
          include: {
            space: {
              include: {
                workspace: {
                  include: { members: { where: { userId } } },
                },
              },
            },
            members: { where: { userId } },
          },
        },
      },
    });

    if (!label) {
      throw new NotFoundException('Label not found');
    }

    // Check access based on whether it's a space or project label
    if (label.space) {
      const isWorkspaceMember = label.space.workspace.members.length > 0;
      if (!isWorkspaceMember) {
        throw new ForbiddenException('Access denied');
      }
      // For space labels, require admin access
      const member = label.space.workspace.members[0];
      if (!['OWNER', 'ADMIN'].includes(member.role)) {
        throw new ForbiddenException('Admin access required');
      }
    } else if (label.project) {
      const isWorkspaceMember =
        label.project.space.workspace.members.length > 0;
      const isProjectOwner = label.project.ownerId === userId;
      if (!isWorkspaceMember && !isProjectOwner) {
        throw new ForbiddenException('Access denied');
      }
      // For project labels, require owner access
      if (!isProjectOwner) {
        throw new ForbiddenException('Project owner access required');
      }
    }

    return label;
  }
}
