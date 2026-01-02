import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient, ViewType, Prisma } from '@pm/db';
import {
  CreateViewDto,
  UpdateViewDto,
  SavedView,
  ViewConfig,
  FilterCondition,
  DEFAULT_VIEW_CONFIG,
  DEFAULT_BOARD_CONFIG,
  DEFAULT_CALENDAR_CONFIG,
  DEFAULT_LIST_CONFIG,
  DEFAULT_TABLE_CONFIG,
  DEFAULT_TIMELINE_CONFIG,
} from '@pm/shared';

// Helper to convert our types to Prisma JSON
type JsonValue = Prisma.InputJsonValue;

@Injectable()
export class ViewsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findByProject(projectId: string, userId: string): Promise<SavedView[]> {
    // Verify project exists and user has access
    await this.verifyProjectAccess(projectId, userId);

    const views = await this.prisma.savedView.findMany({
      where: {
        projectId,
        OR: [{ userId }, { isShared: true }],
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    return views.map(this.mapToDto);
  }

  async findOne(viewId: string, userId: string): Promise<SavedView> {
    const view = await this.prisma.savedView.findUnique({
      where: { id: viewId },
      include: {
        project: {
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
        },
      },
    });

    if (!view) {
      throw new NotFoundException('View not found');
    }

    // Check access
    const isProjectMember =
      view.project.members.length > 0 || view.project.ownerId === userId;
    const isWorkspaceMember =
      view.project.space.workspace.members.length > 0;

    if (!isProjectMember && !isWorkspaceMember) {
      throw new ForbiddenException('Access denied');
    }

    // Check if user can access this view
    if (!view.isShared && view.userId !== userId) {
      throw new ForbiddenException('Access denied to this view');
    }

    return this.mapToDto(view);
  }

  async create(
    projectId: string,
    userId: string,
    data: CreateViewDto,
  ): Promise<SavedView> {
    await this.verifyProjectAccess(projectId, userId);

    // Get the max position for this project
    const maxPosition = await this.prisma.savedView.aggregate({
      where: { projectId, userId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    // Build default config based on view type
    const config = this.buildDefaultConfig(data.type, data.config);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.prisma.savedView.updateMany({
        where: { projectId, userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const view = await this.prisma.savedView.create({
      data: {
        name: data.name,
        type: data.type as ViewType,
        projectId,
        userId,
        isDefault: data.isDefault ?? false,
        isShared: data.isShared ?? false,
        config: config as unknown as JsonValue,
        filters: data.filters
          ? (data.filters as unknown as JsonValue)
          : Prisma.JsonNull,
        position,
      },
    });

    return this.mapToDto(view);
  }

  async update(
    viewId: string,
    userId: string,
    data: UpdateViewDto,
  ): Promise<SavedView> {
    const view = await this.findViewWithAccess(viewId, userId, true);

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await this.prisma.savedView.updateMany({
        where: {
          projectId: view.projectId,
          userId,
          isDefault: true,
          id: { not: viewId },
        },
        data: { isDefault: false },
      });
    }

    // Merge config if provided
    let updatedConfig: unknown = view.config;
    if (data.config) {
      updatedConfig = {
        ...(view.config as object),
        ...data.config,
      };
    }

    const updated = await this.prisma.savedView.update({
      where: { id: viewId },
      data: {
        name: data.name,
        isDefault: data.isDefault,
        isShared: data.isShared,
        config: updatedConfig as JsonValue,
        filters:
          data.filters !== undefined
            ? data.filters === null
              ? Prisma.JsonNull
              : (data.filters as unknown as JsonValue)
            : undefined,
        position: data.position,
      },
    });

    return this.mapToDto(updated);
  }

  async delete(viewId: string, userId: string): Promise<void> {
    await this.findViewWithAccess(viewId, userId, true);
    await this.prisma.savedView.delete({ where: { id: viewId } });
  }

  async setDefault(viewId: string, userId: string): Promise<SavedView> {
    const view = await this.findViewWithAccess(viewId, userId, false);

    // Unset other defaults
    await this.prisma.savedView.updateMany({
      where: {
        projectId: view.projectId,
        userId,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    const updated = await this.prisma.savedView.update({
      where: { id: viewId },
      data: { isDefault: true },
    });

    return this.mapToDto(updated);
  }

  async reorder(
    projectId: string,
    userId: string,
    viewIds: string[],
  ): Promise<void> {
    await this.verifyProjectAccess(projectId, userId);

    // Update positions in a transaction
    await this.prisma.$transaction(
      viewIds.map((id, index) =>
        this.prisma.savedView.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );
  }

  async duplicate(viewId: string, userId: string): Promise<SavedView> {
    const view = await this.findViewWithAccess(viewId, userId, false);

    // Get the max position
    const maxPosition = await this.prisma.savedView.aggregate({
      where: { projectId: view.projectId, userId },
      _max: { position: true },
    });

    const duplicated = await this.prisma.savedView.create({
      data: {
        name: `${view.name} (Copy)`,
        type: view.type,
        projectId: view.projectId,
        userId,
        isDefault: false,
        isShared: false,
        config: view.config as JsonValue,
        filters: view.filters ? (view.filters as JsonValue) : Prisma.JsonNull,
        position: (maxPosition._max.position ?? 0) + 1,
      },
    });

    return this.mapToDto(duplicated);
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

  private async findViewWithAccess(
    viewId: string,
    userId: string,
    requireOwnership: boolean,
  ) {
    const view = await this.prisma.savedView.findUnique({
      where: { id: viewId },
    });

    if (!view) {
      throw new NotFoundException('View not found');
    }

    // Check ownership if required
    if (requireOwnership && view.userId !== userId) {
      throw new ForbiddenException('Only the view owner can modify this view');
    }

    // Check basic access (owner or shared)
    if (!view.isShared && view.userId !== userId) {
      throw new ForbiddenException('Access denied to this view');
    }

    return view;
  }

  private buildDefaultConfig(
    type: string,
    providedConfig?: ViewConfig,
  ): ViewConfig {
    const baseConfig = { ...DEFAULT_VIEW_CONFIG };

    switch (type) {
      case 'LIST':
        baseConfig.listConfig = { ...DEFAULT_LIST_CONFIG };
        break;
      case 'BOARD':
        baseConfig.boardConfig = { ...DEFAULT_BOARD_CONFIG };
        baseConfig.groupBy = 'status';
        break;
      case 'CALENDAR':
        baseConfig.calendarConfig = { ...DEFAULT_CALENDAR_CONFIG };
        break;
      case 'TIMELINE':
        baseConfig.timelineConfig = { ...DEFAULT_TIMELINE_CONFIG };
        break;
      case 'TABLE':
        baseConfig.tableConfig = { ...DEFAULT_TABLE_CONFIG };
        break;
    }

    if (providedConfig) {
      return { ...baseConfig, ...providedConfig };
    }

    return baseConfig;
  }

  private mapToDto(view: {
    id: string;
    name: string;
    type: ViewType;
    projectId: string;
    userId: string;
    isDefault: boolean;
    isShared: boolean;
    config: unknown;
    filters: unknown;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }): SavedView {
    return {
      id: view.id,
      name: view.name,
      type: view.type,
      projectId: view.projectId,
      userId: view.userId,
      isDefault: view.isDefault,
      isShared: view.isShared,
      config: view.config as ViewConfig,
      filters: view.filters as SavedView['filters'],
      position: view.position,
      createdAt: view.createdAt.toISOString(),
      updatedAt: view.updatedAt.toISOString(),
    };
  }
}
