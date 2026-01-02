import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@pm/db';
import { CreateTaskListDto, UpdateTaskListDto, ReorderTaskListDto } from '@pm/shared';

const taskListInclude = {
  _count: {
    select: { tasks: true },
  },
};

const taskListWithTasksInclude = {
  ...taskListInclude,
  tasks: {
    where: { parentId: null }, // Only top-level tasks
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      _count: {
        select: { subtasks: true },
      },
    },
    orderBy: { position: 'asc' as const },
  },
};

@Injectable()
export class TaskListsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAllInProject(projectId: string, userId: string) {
    // Verify user has access to project
    await this.verifyProjectAccess(projectId, userId);

    const taskLists = await this.prisma.taskList.findMany({
      where: { projectId },
      include: taskListWithTasksInclude,
      orderBy: { position: 'asc' },
    });

    return taskLists.map((list) => ({
      ...list,
      taskCount: list._count.tasks,
      tasks: list.tasks.map((task) => ({
        ...task,
        subtaskCount: task._count.subtasks,
      })),
    }));
  }

  async findOne(listId: string, userId: string) {
    const taskList = await this.prisma.taskList.findUnique({
      where: { id: listId },
      include: {
        ...taskListWithTasksInclude,
        project: {
          include: {
            space: {
              include: {
                workspace: {
                  include: {
                    members: { where: { userId } },
                  },
                },
              },
            },
            members: { where: { userId } },
          },
        },
      },
    });

    if (!taskList) {
      throw new NotFoundException('Task list not found');
    }

    // Check access
    const isWorkspaceMember = taskList.project.space.workspace.members.length > 0;
    const isProjectMember =
      taskList.project.members.length > 0 ||
      taskList.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    return {
      ...taskList,
      taskCount: taskList._count.tasks,
      tasks: taskList.tasks.map((task) => ({
        ...task,
        subtaskCount: task._count.subtasks,
      })),
    };
  }

  async create(projectId: string, userId: string, data: CreateTaskListDto) {
    // Verify user has access to project
    await this.verifyProjectAccess(projectId, userId);

    // Get the max position for this project
    const maxPosition = await this.prisma.taskList.aggregate({
      where: { projectId },
      _max: { position: true },
    });

    const position = data.position ?? (maxPosition._max.position ?? -1) + 1;

    const taskList = await this.prisma.taskList.create({
      data: {
        name: data.name,
        position,
        projectId,
      },
      include: taskListInclude,
    });

    return {
      ...taskList,
      taskCount: taskList._count.tasks,
      tasks: [],
    };
  }

  async update(listId: string, userId: string, data: UpdateTaskListDto) {
    const taskList = await this.prisma.taskList.findUnique({
      where: { id: listId },
      include: { project: true },
    });

    if (!taskList) {
      throw new NotFoundException('Task list not found');
    }

    await this.verifyProjectAccess(taskList.projectId, userId);

    const updated = await this.prisma.taskList.update({
      where: { id: listId },
      data: { name: data.name },
      include: taskListInclude,
    });

    return {
      ...updated,
      taskCount: updated._count.tasks,
    };
  }

  async delete(listId: string, userId: string) {
    const taskList = await this.prisma.taskList.findUnique({
      where: { id: listId },
      include: { project: true },
    });

    if (!taskList) {
      throw new NotFoundException('Task list not found');
    }

    // Only project owner can delete task lists
    if (taskList.project.ownerId !== userId) {
      throw new ForbiddenException('Only project owner can delete task lists');
    }

    await this.prisma.taskList.delete({
      where: { id: listId },
    });
  }

  async reorder(listId: string, userId: string, data: ReorderTaskListDto) {
    const taskList = await this.prisma.taskList.findUnique({
      where: { id: listId },
      include: { project: true },
    });

    if (!taskList) {
      throw new NotFoundException('Task list not found');
    }

    await this.verifyProjectAccess(taskList.projectId, userId);

    const oldPosition = taskList.position;
    const newPosition = data.position;

    if (oldPosition === newPosition) {
      return taskList;
    }

    // Update positions of affected lists
    if (newPosition > oldPosition) {
      // Moving down - shift items up
      await this.prisma.taskList.updateMany({
        where: {
          projectId: taskList.projectId,
          position: { gt: oldPosition, lte: newPosition },
        },
        data: { position: { decrement: 1 } },
      });
    } else {
      // Moving up - shift items down
      await this.prisma.taskList.updateMany({
        where: {
          projectId: taskList.projectId,
          position: { gte: newPosition, lt: oldPosition },
        },
        data: { position: { increment: 1 } },
      });
    }

    const updated = await this.prisma.taskList.update({
      where: { id: listId },
      data: { position: newPosition },
      include: taskListInclude,
    });

    return {
      ...updated,
      taskCount: updated._count.tasks,
    };
  }

  private async verifyProjectAccess(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        space: {
          include: {
            workspace: {
              include: {
                members: { where: { userId } },
              },
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
}
