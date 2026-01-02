import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectOwnerGuard } from '../common/guards/project-owner.guard';

@Module({
  controllers: [TasksController],
  providers: [TasksService, ProjectMemberGuard, ProjectOwnerGuard],
})
export class TasksModule {}
