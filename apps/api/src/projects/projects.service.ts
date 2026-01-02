import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaClient } from '@pm/db';

const include = {
  owner: true,
  members: { include: { user: true } },
  _count: { select: { tasks: true } },
};

@Injectable()
export class ProjectsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
      include,
      orderBy: { updatedAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.project.findUnique({ where: { id }, include });
  }

  create(userId: string, data: { name: string; description?: string }) {
    return this.prisma.project.create({
      data: { ...data, ownerId: userId, members: { create: { userId, role: 'OWNER' } } },
      include,
    });
  }

  update(id: string, data: { name?: string; description?: string }) {
    return this.prisma.project.update({ where: { id }, data, include });
  }

  async delete(id: string) {
    await this.prisma.task.deleteMany({ where: { projectId: id } });
    await this.prisma.projectMember.deleteMany({ where: { projectId: id } });
    await this.prisma.project.delete({ where: { id } });
  }

  async addMember(projectId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.projectMember.create({
      data: { userId: user.id, projectId, role: 'MEMBER' },
    });
  }

  removeMember(projectId: string, userId: string) {
    return this.prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });
  }
}
