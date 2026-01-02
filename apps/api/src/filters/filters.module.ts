import { Module } from '@nestjs/common';
import { FiltersController } from './filters.controller';
import { FiltersService } from './filters.service';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';

@Module({
  controllers: [FiltersController],
  providers: [FiltersService, ProjectMemberGuard],
})
export class FiltersModule {}
