import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectOwnerGuard } from '../common/guards/project-owner.guard';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectMemberGuard, ProjectOwnerGuard],
})
export class ProjectsModule {}
