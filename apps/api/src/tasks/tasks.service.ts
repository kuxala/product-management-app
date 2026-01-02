import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient, TaskStatus, TaskPriority } from '@pm/db';
import {
  CreateTaskDto,
  UpdateTaskDto,
  CreateSubtaskDto,
  MoveTaskDto,
  ReorderTaskDto,
  TaskFilters,
} from '@pm/shared';

const assigneeSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
};

const taskInclude = {
  assignee: { select: assigneeSelect },
  _count: { select: { subtasks: true } },
};

const taskWithSubtasksInclude = {
  assignee: { select: assigneeSelect },
  subtasks: {
    include: {
      assignee: { select: assigneeSelect },
      _count: { select: { subtasks: true } },
    },
    orderBy: { position: 'asc' as const },
  },
  _count: { select: { subtasks: true } },
};

@Injectable()
export class TasksService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(
    projectId: string,
    filters: TaskFilters,
  ) {
    const where: {
      projectId: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      taskListId?: string | null;
      parentId?: string | null;
    } = { projectId };

    if (filters.status) {
      where.status = filters.status as TaskStatus;
    }
    if (filters.priority) {
      where.priority = filters.priority as TaskPriority;
    }
    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }
    if (filters.taskListId !== undefined) {
      where.taskListId = filters.taskListId || null;
    }
    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
    } else {
      // Default to only top-level tasks
      where.parentId = null;
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });

    return tasks.map((task) => ({
      ...task,
      subtaskCount: task._count.subtasks,
    }));
  }

  async findOne(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        ...taskWithSubtasksInclude,
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

    // Check access
    const isWorkspaceMember = task.project.space.workspace.members.length > 0;
    const isProjectMember =
      task.project.members.length > 0 || task.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    const completedSubtaskCount = task.subtasks.filter(
      (s) => s.status === 'DONE',
    ).length;

    return {
      ...task,
      project: undefined,
      subtaskCount: task._count.subtasks,
      completedSubtaskCount,
      subtasks: task.subtasks.map((s) => ({
        ...s,
        subtaskCount: s._count.subtasks,
      })),
    };
  }

  async create(projectId: string, taskListId: string | null, data: CreateTaskDto) {
    // Get the max position
    const maxPosition = await this.prisma.task.aggregate({
      where: { projectId, taskListId, parentId: null },
      _max: { position: true },
    });

    const position = data.position ?? (maxPosition._max.position ?? -1) + 1;

    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: (data.status as TaskStatus) || 'TODO',
        priority: (data.priority as TaskPriority) || 'MEDIUM',
        position,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        projectId,
        taskListId,
      },
      include: taskInclude,
    });

    return {
      ...task,
      subtaskCount: task._count.subtasks,
    };
  }

  async createInList(taskListId: string, userId: string, data: CreateTaskDto) {
    // Get task list and verify access
    const taskList = await this.prisma.taskList.findUnique({
      where: { id: taskListId },
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

    return this.create(taskList.projectId, taskListId, data);
  }

  async createSubtask(parentTaskId: string, userId: string, data: CreateSubtaskDto) {
    // Get parent task and verify access
    const parentTask = await this.prisma.task.findUnique({
      where: { id: parentTaskId },
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

    if (!parentTask) {
      throw new NotFoundException('Parent task not found');
    }

    // Check access
    const isWorkspaceMember =
      parentTask.project.space.workspace.members.length > 0;
    const isProjectMember =
      parentTask.project.members.length > 0 ||
      parentTask.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    // Get the max position for subtasks
    const maxPosition = await this.prisma.task.aggregate({
      where: { parentId: parentTaskId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    const subtask = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        projectId: parentTask.projectId,
        taskListId: parentTask.taskListId,
        parentId: parentTaskId,
        position,
      },
      include: taskInclude,
    });

    return {
      ...subtask,
      subtaskCount: subtask._count.subtasks,
    };
  }

  async update(taskId: string, data: UpdateTaskDto) {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status as TaskStatus | undefined,
        priority: data.priority as TaskPriority | undefined,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate !== undefined
          ? data.dueDate
            ? new Date(data.dueDate)
            : null
          : undefined,
        position: data.position,
      },
      include: taskInclude,
    });

    return {
      ...task,
      subtaskCount: task._count.subtasks,
    };
  }

  async move(taskId: string, userId: string, data: MoveTaskDto) {
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

    // Check access
    const isWorkspaceMember = task.project.space.workspace.members.length > 0;
    const isProjectMember =
      task.project.members.length > 0 || task.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    // Verify task list belongs to the same project
    if (data.taskListId) {
      const taskList = await this.prisma.taskList.findUnique({
        where: { id: data.taskListId },
      });

      if (!taskList || taskList.projectId !== task.projectId) {
        throw new NotFoundException('Task list not found in this project');
      }
    }

    // Get the max position in the new list
    const maxPosition = await this.prisma.task.aggregate({
      where: { taskListId: data.taskListId, parentId: null },
      _max: { position: true },
    });

    const position = data.position ?? (maxPosition._max.position ?? -1) + 1;

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        taskListId: data.taskListId,
        position,
      },
      include: taskInclude,
    });

    return {
      ...updated,
      subtaskCount: updated._count.subtasks,
    };
  }

  async reorder(taskId: string, userId: string, data: ReorderTaskDto) {
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

    // Check access
    const isWorkspaceMember = task.project.space.workspace.members.length > 0;
    const isProjectMember =
      task.project.members.length > 0 || task.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    const oldPosition = task.position;
    const newPosition = data.position;

    if (oldPosition === newPosition) {
      return { ...task, subtaskCount: 0 };
    }

    // Update positions of affected tasks
    if (newPosition > oldPosition) {
      // Moving down - shift items up
      await this.prisma.task.updateMany({
        where: {
          taskListId: task.taskListId,
          parentId: task.parentId,
          position: { gt: oldPosition, lte: newPosition },
        },
        data: { position: { decrement: 1 } },
      });
    } else {
      // Moving up - shift items down
      await this.prisma.task.updateMany({
        where: {
          taskListId: task.taskListId,
          parentId: task.parentId,
          position: { gte: newPosition, lt: oldPosition },
        },
        data: { position: { increment: 1 } },
      });
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { position: newPosition },
      include: taskInclude,
    });

    return {
      ...updated,
      subtaskCount: updated._count.subtasks,
    };
  }

  async delete(taskId: string) {
    return this.prisma.task.delete({ where: { id: taskId } });
  }
}
