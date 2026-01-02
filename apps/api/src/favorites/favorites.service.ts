import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaClient, FavoriteType } from '@pm/db';
import { CreateFavoriteDto, ReorderFavoritesDto, RecordViewDto } from '@pm/shared';

@Injectable()
export class FavoritesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { position: 'asc' },
    });

    // Fetch targets for each favorite
    const favoritesWithTargets = await Promise.all(
      favorites.map(async (fav) => {
        const target = await this.getTarget(fav.targetType, fav.targetId);
        return { ...fav, target };
      }),
    );

    return favoritesWithTargets.filter((f) => f.target !== null);
  }

  async create(userId: string, data: CreateFavoriteDto) {
    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: data.targetType as FavoriteType,
          targetId: data.targetId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Already in favorites');
    }

    // Verify target exists and user has access
    const target = await this.getTarget(
      data.targetType as FavoriteType,
      data.targetId,
      userId,
    );
    if (!target) {
      throw new NotFoundException('Target not found or access denied');
    }

    // Get max position
    const maxPosition = await this.prisma.favorite.aggregate({
      where: { userId },
      _max: { position: true },
    });

    const position = (maxPosition._max.position ?? -1) + 1;

    const favorite = await this.prisma.favorite.create({
      data: {
        userId,
        targetType: data.targetType as FavoriteType,
        targetId: data.targetId,
        position,
      },
    });

    return { ...favorite, target };
  }

  async delete(favoriteId: string, userId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { id: favoriteId },
    });

    if (!favorite || favorite.userId !== userId) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.favorite.delete({
      where: { id: favoriteId },
    });
  }

  async reorder(userId: string, data: ReorderFavoritesDto) {
    // Update positions based on the provided order
    await Promise.all(
      data.favoriteIds.map((id, index) =>
        this.prisma.favorite.updateMany({
          where: { id, userId },
          data: { position: index },
        }),
      ),
    );

    return this.findAll(userId);
  }

  // Recent items
  async getRecent(userId: string, limit = 10) {
    const recentItems = await this.prisma.recentItem.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    });

    // Fetch targets for each recent item
    const recentWithTargets = await Promise.all(
      recentItems.map(async (item) => {
        const target = await this.getTarget(item.targetType, item.targetId);
        return { ...item, target };
      }),
    );

    return recentWithTargets.filter((r) => r.target !== null);
  }

  async recordView(userId: string, data: RecordViewDto) {
    await this.prisma.recentItem.upsert({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: data.targetType as FavoriteType,
          targetId: data.targetId,
        },
      },
      update: { viewedAt: new Date() },
      create: {
        userId,
        targetType: data.targetType as FavoriteType,
        targetId: data.targetId,
      },
    });

    // Keep only the last 50 recent items per user
    const recentItems = await this.prisma.recentItem.findMany({
      where: { userId },
      orderBy: { viewedAt: 'desc' },
      skip: 50,
    });

    if (recentItems.length > 0) {
      await this.prisma.recentItem.deleteMany({
        where: { id: { in: recentItems.map((r) => r.id) } },
      });
    }
  }

  private async getTarget(
    type: FavoriteType,
    id: string,
    userId?: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      switch (type) {
        case 'WORKSPACE': {
          const workspace = await this.prisma.workspace.findUnique({
            where: { id },
            include: { _count: { select: { members: true, spaces: true } } },
          });
          if (userId && workspace) {
            const isMember = await this.prisma.workspaceMember.findUnique({
              where: { userId_workspaceId: { userId, workspaceId: id } },
            });
            if (!isMember) return null;
          }
          return workspace as Record<string, unknown> | null;
        }
        case 'SPACE': {
          const space = await this.prisma.space.findUnique({
            where: { id },
            include: { _count: { select: { projects: true } } },
          });
          if (userId && space) {
            const isMember = await this.prisma.workspaceMember.findUnique({
              where: {
                userId_workspaceId: { userId, workspaceId: space.workspaceId },
              },
            });
            if (!isMember) return null;
          }
          return space as Record<string, unknown> | null;
        }
        case 'PROJECT': {
          const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
              owner: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
              _count: { select: { tasks: true } },
            },
          });
          return project as Record<string, unknown> | null;
        }
        case 'TASK_LIST': {
          const taskList = await this.prisma.taskList.findUnique({
            where: { id },
            include: { _count: { select: { tasks: true } } },
          });
          return taskList as Record<string, unknown> | null;
        }
        case 'TASK': {
          const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
              assignee: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          });
          return task as Record<string, unknown> | null;
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
}
