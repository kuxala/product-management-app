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
export class WorkspaceOwnerGuard implements CanActivate {
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

      if (foundMember.role !== 'OWNER') {
        throw new ForbiddenException('Owner access required');
      }

      req.workspaceMember = foundMember;
      return true;
    }

    if (member.role !== 'OWNER') {
      throw new ForbiddenException('Owner access required');
    }

    return true;
  }
}
