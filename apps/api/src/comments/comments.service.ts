import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient } from '@pm/db';
import { CreateCommentDto, UpdateCommentDto, AddReactionDto } from '@pm/shared';

const authorSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
};

@Injectable()
export class CommentsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findByTask(taskId: string, userId: string) {
    await this.verifyTaskAccess(taskId, userId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId, parentId: null },
      include: {
        author: { select: authorSelect },
        replies: {
          include: {
            author: { select: authorSelect },
            reactions: {
              include: { user: { select: authorSelect } },
            },
            _count: { select: { replies: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        reactions: {
          include: { user: { select: authorSelect } },
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((comment) => this.formatComment(comment, userId));
  }

  async create(taskId: string, userId: string, data: CreateCommentDto) {
    await this.verifyTaskAccess(taskId, userId);

    // If it's a reply, verify parent exists
    if (data.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: data.parentId },
      });
      if (!parent || parent.taskId !== taskId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: data.content,
        taskId,
        authorId: userId,
        parentId: data.parentId,
      },
      include: {
        author: { select: authorSelect },
        reactions: {
          include: { user: { select: authorSelect } },
        },
        _count: { select: { replies: true } },
      },
    });

    return this.formatComment(comment, userId);
  }

  async update(commentId: string, userId: string, data: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only the author can edit this comment');
    }

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        content: data.content,
        isEdited: true,
      },
      include: {
        author: { select: authorSelect },
        reactions: {
          include: { user: { select: authorSelect } },
        },
        _count: { select: { replies: true } },
      },
    });

    return this.formatComment(updated, userId);
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
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
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isAuthor = comment.authorId === userId;
    const isAdmin =
      comment.task.project.space.workspace.members.length > 0 &&
      ['OWNER', 'ADMIN'].includes(
        comment.task.project.space.workspace.members[0].role,
      );

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('Not authorized to delete this comment');
    }

    return this.prisma.comment.delete({ where: { id: commentId } });
  }

  async addReaction(commentId: string, userId: string, data: AddReactionDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    await this.verifyTaskAccess(comment.taskId, userId);

    // Check if reaction already exists
    const existing = await this.prisma.reaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId,
          emoji: data.emoji,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Reaction already exists');
    }

    return this.prisma.reaction.create({
      data: {
        emoji: data.emoji,
        commentId,
        userId,
      },
      include: {
        user: { select: authorSelect },
      },
    });
  }

  async removeReaction(commentId: string, userId: string, emoji: string) {
    const reaction = await this.prisma.reaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId,
          emoji,
        },
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    return this.prisma.reaction.delete({ where: { id: reaction.id } });
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

  private formatComment(
    comment: {
      id: string;
      content: string;
      taskId: string;
      authorId: string;
      author: { id: string; name: string; email: string; avatarUrl: string | null };
      parentId: string | null;
      isEdited: boolean;
      createdAt: Date;
      updatedAt: Date;
      reactions: Array<{
        emoji: string;
        userId: string;
        user: { id: string; name: string; email: string; avatarUrl: string | null };
      }>;
      _count: { replies: number };
      replies?: Array<{
        id: string;
        content: string;
        taskId: string;
        authorId: string;
        author: { id: string; name: string; email: string; avatarUrl: string | null };
        parentId: string | null;
        isEdited: boolean;
        createdAt: Date;
        updatedAt: Date;
        reactions: Array<{
          emoji: string;
          userId: string;
          user: { id: string; name: string; email: string; avatarUrl: string | null };
        }>;
        _count: { replies: number };
      }>;
    },
    currentUserId: string,
  ) {
    // Group reactions by emoji
    const reactionGroups = new Map<
      string,
      { emoji: string; users: typeof comment.reactions; count: number }
    >();

    for (const reaction of comment.reactions) {
      const existing = reactionGroups.get(reaction.emoji);
      if (existing) {
        existing.users.push(reaction);
        existing.count++;
      } else {
        reactionGroups.set(reaction.emoji, {
          emoji: reaction.emoji,
          users: [reaction],
          count: 1,
        });
      }
    }

    const reactions = Array.from(reactionGroups.values()).map((group) => ({
      emoji: group.emoji,
      count: group.count,
      users: group.users.map((r) => r.user),
      hasReacted: group.users.some((r) => r.userId === currentUserId),
    }));

    return {
      id: comment.id,
      content: comment.content,
      taskId: comment.taskId,
      authorId: comment.authorId,
      author: comment.author,
      parentId: comment.parentId,
      isEdited: comment.isEdited,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replyCount: comment._count.replies,
      reactions,
      replies: comment.replies?.map((reply) =>
        this.formatComment(reply, currentUserId),
      ),
    };
  }
}
