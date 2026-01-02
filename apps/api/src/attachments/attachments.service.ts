import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@pm/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

const uploaderSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
};

interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class AttachmentsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findByTask(taskId: string, userId: string) {
    await this.verifyTaskAccess(taskId, userId);

    return this.prisma.attachment.findMany({
      where: { taskId },
      include: {
        uploader: { select: uploaderSelect },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(taskId: string, userId: string, file: UploadedFile) {
    await this.verifyTaskAccess(taskId, userId);

    const url = `/uploads/${file.filename}`;

    // Generate thumbnail URL for images
    let thumbnailUrl: string | null = null;
    if (file.mimetype.startsWith('image/')) {
      // For now, use the same URL. In production, you'd generate actual thumbnails
      thumbnailUrl = url;
    }

    return this.prisma.attachment.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        thumbnailUrl,
        taskId,
        uploaderId: userId,
      },
      include: {
        uploader: { select: uploaderSelect },
      },
    });
  }

  async findOne(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        uploader: { select: uploaderSelect },
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

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const isWorkspaceMember =
      attachment.task.project.space.workspace.members.length > 0;
    const isProjectMember =
      attachment.task.project.members.length > 0 ||
      attachment.task.project.ownerId === userId;

    if (!isWorkspaceMember && !isProjectMember) {
      throw new ForbiddenException('Access denied');
    }

    return {
      ...attachment,
      task: undefined,
    };
  }

  async delete(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
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

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const isUploader = attachment.uploaderId === userId;
    const isAdmin =
      attachment.task.project.space.workspace.members.length > 0 &&
      ['OWNER', 'ADMIN'].includes(
        attachment.task.project.space.workspace.members[0].role,
      );

    if (!isUploader && !isAdmin) {
      throw new ForbiddenException('Not authorized to delete this attachment');
    }

    // Delete the file from disk
    try {
      await unlink(join(process.cwd(), 'uploads', attachment.filename));
    } catch {
      // File might already be deleted, continue
    }

    return this.prisma.attachment.delete({ where: { id: attachmentId } });
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
