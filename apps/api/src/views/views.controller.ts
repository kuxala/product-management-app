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
import { ViewsService } from './views.service';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { CurrentUser } from '../common/decorators';
import { CreateViewDto, UpdateViewDto, ReorderViewsDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class ViewsController {
  constructor(private viewsService: ViewsService) {}

  // Views under a project
  @Get('projects/:projectId/views')
  @UseGuards(ProjectMemberGuard)
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.viewsService.findByProject(projectId, user.sub);
  }

  @Post('projects/:projectId/views')
  @UseGuards(ProjectMemberGuard)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateViewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.viewsService.create(projectId, user.sub, dto);
  }

  @Post('projects/:projectId/views/reorder')
  @UseGuards(ProjectMemberGuard)
  reorder(
    @Param('projectId') projectId: string,
    @Body() dto: ReorderViewsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.viewsService.reorder(projectId, user.sub, dto.viewIds);
  }

  // Single view operations
  @Get('views/:viewId')
  findOne(@Param('viewId') viewId: string, @CurrentUser() user: AuthUser) {
    return this.viewsService.findOne(viewId, user.sub);
  }

  @Patch('views/:viewId')
  update(
    @Param('viewId') viewId: string,
    @Body() dto: UpdateViewDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.viewsService.update(viewId, user.sub, dto);
  }

  @Delete('views/:viewId')
  delete(@Param('viewId') viewId: string, @CurrentUser() user: AuthUser) {
    return this.viewsService.delete(viewId, user.sub);
  }

  @Patch('views/:viewId/default')
  setDefault(@Param('viewId') viewId: string, @CurrentUser() user: AuthUser) {
    return this.viewsService.setDefault(viewId, user.sub);
  }

  @Post('views/:viewId/duplicate')
  duplicate(@Param('viewId') viewId: string, @CurrentUser() user: AuthUser) {
    return this.viewsService.duplicate(viewId, user.sub);
  }
}
