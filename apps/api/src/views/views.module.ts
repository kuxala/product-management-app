import { Module } from '@nestjs/common';
import { ViewsController } from './views.controller';
import { ViewsService } from './views.service';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';

@Module({
  controllers: [ViewsController],
  providers: [ViewsService, ProjectMemberGuard],
})
export class ViewsModule {}
