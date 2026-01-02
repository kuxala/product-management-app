import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaClient } from '@pm/db';
import { RequestWithWorkspace } from './workspace-member.guard';

@Injectable()
export class WorkspaceAdminGuard implements CanActivate {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestWithWorkspace>();

    // This guard should be used after WorkspaceMemberGuard
    // which sets req.workspaceMember
    const member = req.workspaceMember;

    if (!member) {
      // If WorkspaceMemberGuard wasn't run first, check membership
      const userId = req.user?.sub;
      const workspaceId = req.params.workspaceId || req.params.id;

      if (!userId || !workspaceId) {
        throw new ForbiddenException();
      }

      const foundMember = await this.prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: { userId, workspaceId },
        },
      });

      if (!foundMember) {
        throw new ForbiddenException('Not a member of this workspace');
      }

      if (!['OWNER', 'ADMIN'].includes(foundMember.role)) {
        throw new ForbiddenException('Admin access required');
      }

      req.workspaceMember = foundMember;
      return true;
    }

    if (!['OWNER', 'ADMIN'].includes(member.role)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
