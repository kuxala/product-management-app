import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaClient, WorkspaceMember } from '@pm/db';

export interface RequestWithWorkspace extends Request {
  user: { sub: string };
  workspaceMember: WorkspaceMember;
  params: { workspaceId?: string; id?: string };
}

@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<RequestWithWorkspace>();
    const userId = req.user?.sub;
    const workspaceId = req.params.workspaceId || req.params.id;

    if (!userId || !workspaceId) {
      throw new ForbiddenException();
    }

    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
      include: {
        workspace: true,
      },
    });

    if (!member) {
      // Check if workspace exists
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });
      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }
      throw new ForbiddenException('Not a member of this workspace');
    }

    req.workspaceMember = member;
    return true;
  }
}
