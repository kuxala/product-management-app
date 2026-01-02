import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@pm/db';
import { CreateInvitationDto } from '@pm/shared';

const invitationInclude = {
  invitedBy: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
  workspace: {
    select: { id: true, name: true, slug: true },
  },
};

@Injectable()
export class InvitationsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async getAll(workspaceId: string) {
    return this.prisma.invitation.findMany({
      where: { workspaceId, status: 'PENDING' },
      include: invitationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    workspaceId: string,
    data: CreateInvitationDto,
    invitedById: string,
  ) {
    // Check if user is already a member
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: { userId: existingUser.id, workspaceId },
        },
      });

      if (existingMember) {
        throw new ConflictException(
          'User is already a member of this workspace',
        );
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: data.email,
        workspaceId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'An invitation has already been sent to this email',
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await this.prisma.invitation.create({
      data: {
        email: data.email,
        workspaceId,
        role: data.role || 'MEMBER',
        invitedById,
        expiresAt,
      },
      include: invitationInclude,
    });

    // TODO: Send email notification here

    return invitation;
  }

  async resend(invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { expiresAt, updatedAt: new Date() },
      include: invitationInclude,
    });

    // TODO: Resend email notification

    return updated;
  }

  async cancel(invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Invitation cancelled' };
  }

  async getByToken(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: invitationInclude,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation has expired');
    }

    return invitation;
  }

  async accept(token: string, userId: string) {
    const invitation = await this.getByToken(token);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify email matches
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException(
        'This invitation was sent to a different email address',
      );
    }

    // Create workspace member and update invitation in transaction
    await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return { message: 'Invitation accepted', workspaceId: invitation.workspaceId };
  }
}
