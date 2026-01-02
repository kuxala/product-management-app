import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient, CustomFieldType } from '@pm/db';
import {
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
  SetCustomFieldValueDto,
} from '@pm/shared';

@Injectable()
export class CustomFieldsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findBySpace(spaceId: string, userId: string) {
    await this.verifySpaceAccess(spaceId, userId);

    return this.prisma.customField.findMany({
      where: { spaceId },
      orderBy: { position: 'asc' },
    });
  }

  async findByProject(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);

    return this.prisma.customField.findMany({
      where: { projectId },
      orderBy: { position: 'asc' },
    });
  }

  async createForSpace(
    spaceId: string,
    userId: string,
    data: CreateCustomFieldDto,
  ) {
    await this.verifySpaceAdminAccess(spaceId, userId);

    // Get max position
    const maxPosition = await this.prisma.customField.aggregate({
      where: { spaceId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    return this.prisma.customField.create({
      data: {
        name: data.name,
        type: data.type as CustomFieldType,
        description: data.description,
        required: data.required ?? false,
        options: data.options as object[] | undefined,
        spaceId,
        position,
      },
    });
  }

  async createForProject(
    projectId: string,
    userId: string,
    data: CreateCustomFieldDto,
  ) {
    await this.verifyProjectOwnerAccess(projectId, userId);

    // Get max position
    const maxPosition = await this.prisma.customField.aggregate({
      where: { projectId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    return this.prisma.customField.create({
      data: {
        name: data.name,
        type: data.type as CustomFieldType,
        description: data.description,
        required: data.required ?? false,
        options: data.options as object[] | undefined,
        projectId,
        position,
      },
    });
  }

  async update(fieldId: string, userId: string, data: UpdateCustomFieldDto) {
    await this.verifyFieldAccess(fieldId, userId);

    return this.prisma.customField.update({
      where: { id: fieldId },
      data: {
        name: data.name,
        description: data.description,
        required: data.required,
        options: data.options as object[] | undefined,
      },
    });
  }

  async delete(fieldId: string, userId: string) {
    await this.verifyFieldAccess(fieldId, userId);
    return this.prisma.customField.delete({ where: { id: fieldId } });
  }

  async setTaskFieldValue(
    taskId: string,
    fieldId: string,
    userId: string,
    data: SetCustomFieldValueDto,
  ) {
    await this.verifyTaskAccess(taskId, userId);

    // Verify field exists and is applicable to the task
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { space: true } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const field = await this.prisma.customField.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      throw new NotFoundException('Custom field not found');
    }

    // Field must belong to the task's project or space
    if (field.projectId && field.projectId !== task.projectId) {
      throw new ForbiddenException('Field does not belong to this project');
    }
    if (field.spaceId && field.spaceId !== task.project.spaceId) {
      throw new ForbiddenException('Field does not belong to this space');
    }

    return this.prisma.customFieldValue.upsert({
      where: {
        taskId_customFieldId: { taskId, customFieldId: fieldId },
      },
      create: {
        taskId,
        customFieldId: fieldId,
        value: data.value as object,
      },
      update: {
        value: data.value as object,
      },
      include: {
        customField: true,
      },
    });
  }

  async clearTaskFieldValue(taskId: string, fieldId: string, userId: string) {
    await this.verifyTaskAccess(taskId, userId);

    const value = await this.prisma.customFieldValue.findUnique({
      where: {
        taskId_customFieldId: { taskId, customFieldId: fieldId },
      },
    });

    if (!value) {
      throw new NotFoundException('Field value not found');
    }

    return this.prisma.customFieldValue.delete({ where: { id: value.id } });
  }

  async getTaskFieldValues(taskId: string, userId: string) {
    await this.verifyTaskAccess(taskId, userId);

    return this.prisma.customFieldValue.findMany({
      where: { taskId },
      include: { customField: true },
    });
  }

  private async verifySpaceAccess(spaceId: string, userId: string) {
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

    return space;
  }

  private async verifySpaceAdminAccess(spaceId: string, userId: string) {
    const space = await this.verifySpaceAccess(spaceId, userId);

    const member = space.workspace.members[0];
    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('Admin access required');
    }

    return space;
  }

  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
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
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isWorkspaceMember = project.space.workspace.members.length > 0;
    const isProjectMember =
      project.members.length > 0 || project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  private async verifyProjectOwnerAccess(projectId: string, userId: string) {
    const project = await this.verifyProjectAccess(projectId, userId);

    if (project.ownerId !== userId) {
      throw new ForbiddenException('Project owner access required');
    }

    return project;
  }

  private async verifyFieldAccess(fieldId: string, userId: string) {
    const field = await this.prisma.customField.findUnique({
      where: { id: fieldId },
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
          },
        },
      },
    });

    if (!field) {
      throw new NotFoundException('Custom field not found');
    }

    if (field.space) {
      const member = field.space.workspace.members[0];
      if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
        throw new ForbiddenException('Admin access required');
      }
    } else if (field.project) {
      if (field.project.ownerId !== userId) {
        throw new ForbiddenException('Project owner access required');
      }
    }

    return field;
  }

  private async verifyTaskAccess(taskId: string, userId: string) {
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

    return task;
  }
}
