import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FiltersService } from './filters.service';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { CurrentUser } from '../common/decorators';
import { CreateFilterDto, UpdateFilterDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class FiltersController {
  constructor(private filtersService: FiltersService) {}

  // Filters under a project
  @Get('projects/:projectId/filters')
  @UseGuards(ProjectMemberGuard)
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filtersService.findByProject(projectId, user.sub);
  }

  @Post('projects/:projectId/filters')
  @UseGuards(ProjectMemberGuard)
  createForProject(
    @Param('projectId') projectId: string,
    @Body() dto: CreateFilterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filtersService.createForProject(projectId, user.sub, dto);
  }

  // Filters under a space
  @Get('spaces/:spaceId/filters')
  findBySpace(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filtersService.findBySpace(spaceId, user.sub);
  }

  @Post('spaces/:spaceId/filters')
  createForSpace(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateFilterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filtersService.createForSpace(spaceId, user.sub, dto);
  }

  // Single filter operations
  @Get('filters/:filterId')
  findOne(@Param('filterId') filterId: string, @CurrentUser() user: AuthUser) {
    return this.filtersService.findOne(filterId, user.sub);
  }

  @Patch('filters/:filterId')
  update(
    @Param('filterId') filterId: string,
    @Body() dto: UpdateFilterDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.filtersService.update(filterId, user.sub, dto);
  }

  @Delete('filters/:filterId')
  delete(@Param('filterId') filterId: string, @CurrentUser() user: AuthUser) {
    return this.filtersService.delete(filterId, user.sub);
  }
}
