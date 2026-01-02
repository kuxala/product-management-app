import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient, DependencyType, TaskStatus } from '@pm/db';
import { CreateDependencyDto } from '@pm/shared';

const taskSelect = {
  id: true,
  title: true,
  status: true,
};

@Injectable()
export class DependenciesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findByTask(taskId: string, userId: string) {
    await this.verifyTaskAccess(taskId, userId);

    const dependencies = await this.prisma.taskDependency.findMany({
      where: {
        OR: [{ dependentTaskId: taskId }, { dependsOnTaskId: taskId }],
      },
      include: {
        dependentTask: { select: taskSelect },
        dependsOnTask: { select: taskSelect },
      },
      orderBy: { createdAt: 'asc' },
    });

    return dependencies.map((dep) => ({
      ...dep,
      isBlocked: this.isBlocked(dep.dependsOnTask.status, dep.type),
    }));
  }

  async create(taskId: string, userId: string, data: CreateDependencyDto) {
    await this.verifyTaskAccess(taskId, userId);

    // Verify dependsOn task exists and is in the same project
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    const dependsOnTask = await this.prisma.task.findUnique({
      where: { id: data.dependsOnTaskId },
    });

    if (!dependsOnTask) {
      throw new NotFoundException('Depends-on task not found');
    }

    if (task?.projectId !== dependsOnTask.projectId) {
      throw new BadRequestException(
        'Tasks must be in the same project to create a dependency',
      );
    }

    // Check for self-dependency
    if (taskId === data.dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    // Check for existing dependency
    const existing = await this.prisma.taskDependency.findUnique({
      where: {
        dependentTaskId_dependsOnTaskId: {
          dependentTaskId: taskId,
          dependsOnTaskId: data.dependsOnTaskId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Dependency already exists');
    }

    // Check for circular dependency
    const hasCycle = await this.detectCycle(taskId, data.dependsOnTaskId);
    if (hasCycle) {
      throw new ConflictException('This would create a circular dependency');
    }

    const dependency = await this.prisma.taskDependency.create({
      data: {
        dependentTaskId: taskId,
        dependsOnTaskId: data.dependsOnTaskId,
        type: (data.type as DependencyType) || 'FINISH_TO_START',
      },
      include: {
        dependentTask: { select: taskSelect },
        dependsOnTask: { select: taskSelect },
      },
    });

    return {
      ...dependency,
      isBlocked: this.isBlocked(dependency.dependsOnTask.status, dependency.type),
    };
  }

  async delete(dependencyId: string, userId: string) {
    const dependency = await this.prisma.taskDependency.findUnique({
      where: { id: dependencyId },
      include: {
        dependentTask: {
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

    if (!dependency) {
      throw new NotFoundException('Dependency not found');
    }

    const isWorkspaceMember =
      dependency.dependentTask.project.space.workspace.members.length > 0;
    const isProjectMember =
      dependency.dependentTask.project.members.length > 0 ||
      dependency.dependentTask.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.taskDependency.delete({ where: { id: dependencyId } });
  }

  private isBlocked(dependsOnStatus: TaskStatus, type: DependencyType): boolean {
    switch (type) {
      case 'FINISH_TO_START':
        return dependsOnStatus !== 'DONE';
      case 'START_TO_START':
        return dependsOnStatus === 'TODO';
      case 'FINISH_TO_FINISH':
        return dependsOnStatus !== 'DONE';
      case 'START_TO_FINISH':
        return dependsOnStatus === 'TODO';
      default:
        return false;
    }
  }

  private async detectCycle(
    taskId: string,
    dependsOnId: string,
  ): Promise<boolean> {
    const visited = new Set<string>();
    const stack = [dependsOnId];

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (current === taskId) {
        return true;
      }

      if (visited.has(current)) {
        continue;
      }

      visited.add(current);

      const deps = await this.prisma.taskDependency.findMany({
        where: { dependentTaskId: current },
        select: { dependsOnTaskId: true },
      });

      stack.push(...deps.map((d) => d.dependsOnTaskId));
    }

    return false;
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
