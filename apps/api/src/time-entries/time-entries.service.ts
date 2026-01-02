import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient } from '@pm/db';
import {
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  StartTimerDto,
} from '@pm/shared';

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
};

const taskSelect = {
  id: true,
  title: true,
  status: true,
};

@Injectable()
export class TimeEntriesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findByTask(taskId: string, userId: string) {
    await this.verifyTaskAccess(taskId, userId);

    const entries = await this.prisma.timeEntry.findMany({
      where: { taskId },
      include: {
        user: { select: userSelect },
        task: { select: taskSelect },
      },
      orderBy: { startTime: 'desc' },
    });

    return entries.map((entry) => ({
      ...entry,
      duration: this.calculateDuration(entry),
    }));
  }

  async findByProject(projectId: string, userId: string) {
    await this.verifyProjectAccess(projectId, userId);

    const entries = await this.prisma.timeEntry.findMany({
      where: { task: { projectId } },
      include: {
        user: { select: userSelect },
        task: { select: taskSelect },
      },
      orderBy: { startTime: 'desc' },
    });

    return entries.map((entry) => ({
      ...entry,
      duration: this.calculateDuration(entry),
    }));
  }

  async create(userId: string, data: CreateTimeEntryDto) {
    await this.verifyTaskAccess(data.taskId, userId);

    const duration =
      data.duration ??
      (data.endTime
        ? Math.round(
            (new Date(data.endTime).getTime() -
              new Date(data.startTime).getTime()) /
              60000,
          )
        : null);

    return this.prisma.timeEntry.create({
      data: {
        taskId: data.taskId,
        userId,
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        duration,
        billable: data.billable ?? true,
      },
      include: {
        user: { select: userSelect },
        task: { select: taskSelect },
      },
    });
  }

  async update(entryId: string, userId: string, data: UpdateTimeEntryDto) {
    const entry = await this.findEntryWithAccess(entryId, userId);

    if (entry.userId !== userId) {
      throw new ForbiddenException('Only the owner can update this entry');
    }

    const startTime = data.startTime
      ? new Date(data.startTime)
      : entry.startTime;
    const endTime = data.endTime
      ? new Date(data.endTime)
      : data.endTime === null
        ? null
        : entry.endTime;

    const duration =
      data.duration ??
      (endTime
        ? Math.round((endTime.getTime() - startTime.getTime()) / 60000)
        : entry.duration);

    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        description: data.description,
        startTime,
        endTime,
        duration,
        billable: data.billable,
      },
      include: {
        user: { select: userSelect },
        task: { select: taskSelect },
      },
    });
  }

  async delete(entryId: string, userId: string) {
    const entry = await this.findEntryWithAccess(entryId, userId);

    if (entry.userId !== userId) {
      throw new ForbiddenException('Only the owner can delete this entry');
    }

    return this.prisma.timeEntry.delete({ where: { id: entryId } });
  }

  async startTimer(userId: string, data: StartTimerDto) {
    await this.verifyTaskAccess(data.taskId, userId);

    // Check if user already has a running timer
    const runningTimer = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (runningTimer) {
      throw new ConflictException(
        'You already have a running timer. Stop it first.',
      );
    }

    return this.prisma.timeEntry.create({
      data: {
        taskId: data.taskId,
        userId,
        description: data.description,
        startTime: new Date(),
        billable: true,
      },
      include: {
        user: { select: userSelect },
        task: { select: taskSelect },
      },
    });
  }

  async stopTimer(entryId: string, userId: string) {
    const entry = await this.findEntryWithAccess(entryId, userId);

    if (entry.userId !== userId) {
      throw new ForbiddenException('Only the owner can stop this timer');
    }

    if (entry.endTime) {
      throw new ConflictException('Timer is already stopped');
    }

    const endTime = new Date();
    const duration = Math.round(
      (endTime.getTime() - entry.startTime.getTime()) / 60000,
    );

    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        endTime,
        duration,
      },
      include: {
        user: { select: userSelect },
        task: { select: taskSelect },
      },
    });
  }

  async getRunningTimer(userId: string) {
    return this.prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null,
      },
      include: {
        user: { select: userSelect },
        task: { select: taskSelect },
      },
    });
  }

  private calculateDuration(entry: {
    startTime: Date;
    endTime: Date | null;
    duration: number | null;
  }): number {
    if (entry.duration !== null) {
      return entry.duration;
    }
    if (entry.endTime) {
      return Math.round(
        (entry.endTime.getTime() - entry.startTime.getTime()) / 60000,
      );
    }
    // Running timer - calculate current duration
    return Math.round((Date.now() - entry.startTime.getTime()) / 60000);
  }

  private async findEntryWithAccess(entryId: string, userId: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id: entryId },
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

    if (!entry) {
      throw new NotFoundException('Time entry not found');
    }

    const isWorkspaceMember =
      entry.task.project.space.workspace.members.length > 0;
    const isProjectMember =
      entry.task.project.members.length > 0 ||
      entry.task.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    return entry;
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
}
