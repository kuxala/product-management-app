import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient, WorkspaceRole } from '@pm/db';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
} from '@pm/shared';

const workspaceInclude = {
  _count: {
    select: { members: true, spaces: true },
  },
};

const memberInclude = {
  user: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
};

@Injectable()
export class WorkspacesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: workspaceInclude,
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
      memberCount: m.workspace._count.members,
    }));
  }

  async findOne(workspaceId: string, userId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
      include: {
        workspace: {
          include: {
            ...workspaceInclude,
            spaces: {
              include: {
                _count: { select: { projects: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }

    return {
      ...membership.workspace,
      role: membership.role,
      memberCount: membership.workspace._count.members,
      spaces: membership.workspace.spaces.map((s) => ({
        ...s,
        projectCount: s._count.projects,
      })),
    };
  }

  async findBySlug(slug: string, userId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return this.findOne(workspace.id, userId);
  }

  async create(userId: string, data: CreateWorkspaceDto) {
    // Check if slug is already taken
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException('Workspace slug is already taken');
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: workspaceInclude,
    });

    return {
      ...workspace,
      role: 'OWNER' as WorkspaceRole,
      memberCount: workspace._count.members,
    };
  }

  async update(workspaceId: string, data: UpdateWorkspaceDto) {
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: data.name,
        description: data.description,
        logoUrl: data.logoUrl,
      },
      include: workspaceInclude,
    });

    return workspace;
  }

  async delete(workspaceId: string) {
    await this.prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }

  async getMembers(workspaceId: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: memberInclude,
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });

    return members;
  }

  async inviteMember(workspaceId: string, data: InviteWorkspaceMemberDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new NotFoundException('User not found with this email');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: user.id, workspaceId },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const member = await this.prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId,
        role: data.role || 'MEMBER',
      },
      include: memberInclude,
    });

    return member;
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    data: UpdateWorkspaceMemberDto,
    currentUserId: string,
  ) {
    // Can't change your own role
    if (targetUserId === currentUserId) {
      throw new ForbiddenException('Cannot change your own role');
    }

    // Can't make someone else an owner (transfer ownership would be a separate feature)
    if (data.role === 'OWNER') {
      throw new ForbiddenException('Cannot assign owner role');
    }

    const member = await this.prisma.workspaceMember.update({
      where: {
        userId_workspaceId: { userId: targetUserId, workspaceId },
      },
      data: { role: data.role },
      include: memberInclude,
    });

    return member;
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
    currentUserId: string,
  ) {
    // Can't remove yourself (use leave instead)
    if (targetUserId === currentUserId) {
      throw new ForbiddenException('Cannot remove yourself. Use leave instead.');
    }

    // Check if target is owner
    const targetMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: targetUserId, workspaceId },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: { userId: targetUserId, workspaceId },
      },
    });
  }

  async leaveWorkspace(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });

    if (!member) {
      throw new NotFoundException('Not a member of this workspace');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException(
        'Owner cannot leave workspace. Transfer ownership first.',
      );
    }

    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });
  }
}
