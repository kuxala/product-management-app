import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException, Inject } from '@nestjs/common';
import { PrismaClient } from '@pm/db';

@Injectable()
export class ProjectOwnerGuard implements CanActivate {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const { sub: userId } = req.user || {};
    const projectId = req.params.projectId || req.params.id;
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });
    if (!project) throw new NotFoundException();
    if (project.ownerId !== userId) throw new ForbiddenException();
    req.project = project;
    req.isOwner = true;
    return true;
  }
}
