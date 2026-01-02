import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@pm/db';
import {
  CreateChecklistDto,
  UpdateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  ReorderChecklistItemsDto,
} from '@pm/shared';

const assigneeSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
};

@Injectable()
export class ChecklistsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findByTask(taskId: string, userId: string) {
    await this.verifyTaskAccess(taskId, userId);

    const checklists = await this.prisma.checklist.findMany({
      where: { taskId },
      include: {
        items: {
          include: {
            assignee: { select: assigneeSelect },
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    return checklists.map((checklist) => ({
      ...checklist,
      progress: this.calculateProgress(checklist.items),
    }));
  }

  async create(taskId: string, userId: string, data: CreateChecklistDto) {
    await this.verifyTaskAccess(taskId, userId);

    // Get max position
    const maxPosition = await this.prisma.checklist.aggregate({
      where: { taskId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    const checklist = await this.prisma.checklist.create({
      data: {
        name: data.name,
        taskId,
        position,
        items: data.items
          ? {
              create: data.items.map((item, index) => ({
                content: item.content,
                assigneeId: item.assigneeId,
                dueDate: item.dueDate ? new Date(item.dueDate) : null,
                position: index,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          include: {
            assignee: { select: assigneeSelect },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    return {
      ...checklist,
      progress: this.calculateProgress(checklist.items),
    };
  }

  async update(checklistId: string, userId: string, data: UpdateChecklistDto) {
    await this.verifyChecklistAccess(checklistId, userId);

    const checklist = await this.prisma.checklist.update({
      where: { id: checklistId },
      data: {
        name: data.name,
      },
      include: {
        items: {
          include: {
            assignee: { select: assigneeSelect },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    return {
      ...checklist,
      progress: this.calculateProgress(checklist.items),
    };
  }

  async delete(checklistId: string, userId: string) {
    await this.verifyChecklistAccess(checklistId, userId);
    return this.prisma.checklist.delete({ where: { id: checklistId } });
  }

  async addItem(
    checklistId: string,
    userId: string,
    data: CreateChecklistItemDto,
  ) {
    await this.verifyChecklistAccess(checklistId, userId);

    // Get max position
    const maxPosition = await this.prisma.checklistItem.aggregate({
      where: { checklistId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    return this.prisma.checklistItem.create({
      data: {
        content: data.content,
        checklistId,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        position,
      },
      include: {
        assignee: { select: assigneeSelect },
      },
    });
  }

  async updateItem(
    itemId: string,
    userId: string,
    data: UpdateChecklistItemDto,
  ) {
    await this.verifyItemAccess(itemId, userId);

    return this.prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        content: data.content,
        isCompleted: data.isCompleted,
        assigneeId: data.assigneeId,
        dueDate:
          data.dueDate !== undefined
            ? data.dueDate
              ? new Date(data.dueDate)
              : null
            : undefined,
      },
      include: {
        assignee: { select: assigneeSelect },
      },
    });
  }

  async deleteItem(itemId: string, userId: string) {
    await this.verifyItemAccess(itemId, userId);
    return this.prisma.checklistItem.delete({ where: { id: itemId } });
  }

  async reorderItems(
    checklistId: string,
    userId: string,
    data: ReorderChecklistItemsDto,
  ) {
    await this.verifyChecklistAccess(checklistId, userId);

    // Update positions based on the order in the array
    await this.prisma.$transaction(
      data.itemIds.map((itemId, index) =>
        this.prisma.checklistItem.update({
          where: { id: itemId },
          data: { position: index },
        }),
      ),
    );

    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        items: {
          include: {
            assignee: { select: assigneeSelect },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    return {
      ...checklist,
      progress: this.calculateProgress(checklist?.items ?? []),
    };
  }

  private calculateProgress(
    items: Array<{ isCompleted: boolean }>,
  ): number {
    if (items.length === 0) return 0;
    const completed = items.filter((item) => item.isCompleted).length;
    return Math.round((completed / items.length) * 100);
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

  private async verifyChecklistAccess(checklistId: string, userId: string) {
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
      include: {
        task: {
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
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const isWorkspaceMember =
      checklist.task.project.space.workspace.members.length > 0;
    const isProjectMember =
      checklist.task.project.members.length > 0 ||
      checklist.task.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    return checklist;
  }

  private async verifyItemAccess(itemId: string, userId: string) {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: {
        checklist: {
          include: {
            task: {
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
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    const isWorkspaceMember =
      item.checklist.task.project.space.workspace.members.length > 0;
    const isProjectMember =
      item.checklist.task.project.members.length > 0 ||
      item.checklist.task.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    return item;
  }
}
