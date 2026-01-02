import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@pm/db';
import {
  CreateFilterDto,
  UpdateFilterDto,
  SavedFilter,
  FilterCondition,
} from '@pm/shared';

// Helper type for Prisma JSON
type JsonValue = Prisma.InputJsonValue;

@Injectable()
export class FiltersService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findByProject(projectId: string, userId: string): Promise<SavedFilter[]> {
    await this.verifyProjectAccess(projectId, userId);

    const filters = await this.prisma.savedFilter.findMany({
      where: {
        projectId,
        OR: [{ userId }, { isShared: true }],
      },
      orderBy: { name: 'asc' },
    });

    return filters.map(this.mapToDto);
  }

  async findBySpace(spaceId: string, userId: string): Promise<SavedFilter[]> {
    await this.verifySpaceAccess(spaceId, userId);

    const filters = await this.prisma.savedFilter.findMany({
      where: {
        spaceId,
        OR: [{ userId }, { isShared: true }],
      },
      orderBy: { name: 'asc' },
    });

    return filters.map(this.mapToDto);
  }

  async findOne(filterId: string, userId: string): Promise<SavedFilter> {
    const filter = await this.prisma.savedFilter.findUnique({
      where: { id: filterId },
    });

    if (!filter) {
      throw new NotFoundException('Filter not found');
    }

    // Check access
    if (!filter.isShared && filter.userId !== userId) {
      throw new ForbiddenException('Access denied to this filter');
    }

    return this.mapToDto(filter);
  }

  async createForProject(
    projectId: string,
    userId: string,
    data: CreateFilterDto,
  ): Promise<SavedFilter> {
    await this.verifyProjectAccess(projectId, userId);

    const filter = await this.prisma.savedFilter.create({
      data: {
        name: data.name,
        projectId,
        userId,
        isShared: data.isShared ?? false,
        conditions: data.conditions as unknown as JsonValue,
      },
    });

    return this.mapToDto(filter);
  }

  async createForSpace(
    spaceId: string,
    userId: string,
    data: CreateFilterDto,
  ): Promise<SavedFilter> {
    await this.verifySpaceAccess(spaceId, userId);

    const filter = await this.prisma.savedFilter.create({
      data: {
        name: data.name,
        spaceId,
        userId,
        isShared: data.isShared ?? false,
        conditions: data.conditions as unknown as JsonValue,
      },
    });

    return this.mapToDto(filter);
  }

  async update(
    filterId: string,
    userId: string,
    data: UpdateFilterDto,
  ): Promise<SavedFilter> {
    const filter = await this.findFilterWithAccess(filterId, userId, true);

    const updated = await this.prisma.savedFilter.update({
      where: { id: filterId },
      data: {
        name: data.name,
        isShared: data.isShared,
        conditions: data.conditions
          ? (data.conditions as unknown as JsonValue)
          : undefined,
      },
    });

    return this.mapToDto(updated);
  }

  async delete(filterId: string, userId: string): Promise<void> {
    await this.findFilterWithAccess(filterId, userId, true);
    await this.prisma.savedFilter.delete({ where: { id: filterId } });
  }

  private async verifyProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { where: { userId } },
        space: {
          include: {
            workspace: {
              include: { members: { where: { userId } } },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isProjectMember =
      project.members.length > 0 || project.ownerId === userId;
    const isWorkspaceMember = project.space.workspace.members.length > 0;

    if (!isProjectMember && !isWorkspaceMember) {
      throw new ForbiddenException('Access denied');
    }
  }

  private async verifySpaceAccess(
    spaceId: string,
    userId: string,
  ): Promise<void> {
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
  }

  private async findFilterWithAccess(
    filterId: string,
    userId: string,
    requireOwnership: boolean,
  ) {
    const filter = await this.prisma.savedFilter.findUnique({
      where: { id: filterId },
    });

    if (!filter) {
      throw new NotFoundException('Filter not found');
    }

    // Check ownership if required
    if (requireOwnership && filter.userId !== userId) {
      throw new ForbiddenException(
        'Only the filter owner can modify this filter',
      );
    }

    // Check basic access (owner or shared)
    if (!filter.isShared && filter.userId !== userId) {
      throw new ForbiddenException('Access denied to this filter');
    }

    return filter;
  }

  private mapToDto(filter: {
    id: string;
    name: string;
    projectId: string | null;
    spaceId: string | null;
    userId: string;
    isShared: boolean;
    conditions: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): SavedFilter {
    return {
      id: filter.id,
      name: filter.name,
      projectId: filter.projectId,
      spaceId: filter.spaceId,
      userId: filter.userId,
      isShared: filter.isShared,
      conditions: filter.conditions as FilterCondition[],
      createdAt: filter.createdAt.toISOString(),
      updatedAt: filter.updatedAt.toISOString(),
    };
  }
}
