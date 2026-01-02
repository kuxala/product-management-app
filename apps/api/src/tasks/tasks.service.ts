import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient, TaskStatus, TaskPriority } from '@pm/db';
import { CreateTaskDto, UpdateTaskDto } from '@pm/shared';

@Injectable()
export class TasksService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  findAll(projectId: string, filters: { status?: string; priority?: string; assigneeId?: string }) {
    const where: {
      projectId: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
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

    return this.prisma.task.findMany({
      where,
      include: { assignee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(projectId: string, data: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status as TaskStatus | undefined,
        priority: data.priority as TaskPriority | undefined,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        projectId,
      },
      include: { assignee: true },
    });
  }

  update(taskId: string, data: UpdateTaskDto) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status as TaskStatus | undefined,
        priority: data.priority as TaskPriority | undefined,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: { assignee: true },
    });
  }

  delete(taskId: string) {
    return this.prisma.task.delete({ where: { id: taskId } });
  }
}
