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
import { LabelsService } from './labels.service';
import { CurrentUser } from '../common/decorators';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectOwnerGuard } from '../common/guards/project-owner.guard';
import { CreateLabelDto, UpdateLabelDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class LabelsController {
  constructor(private labelsService: LabelsService) {}

  // Space-level labels (authorization handled in service)
  @Get('spaces/:spaceId/labels')
  findBySpace(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.labelsService.findBySpace(spaceId, user.sub);
  }

  @Post('spaces/:spaceId/labels')
  createForSpace(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateLabelDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.labelsService.createForSpace(spaceId, user.sub, dto);
  }

  // Project-level labels
  @Get('projects/:projectId/labels')
  @UseGuards(ProjectMemberGuard)
  findByProject(@Param('projectId') projectId: string) {
    return this.labelsService.findByProject(projectId);
  }

  @Post('projects/:projectId/labels')
  @UseGuards(ProjectMemberGuard, ProjectOwnerGuard)
  createForProject(
    @Param('projectId') projectId: string,
    @Body() dto: CreateLabelDto,
  ) {
    return this.labelsService.createForProject(projectId, dto);
  }

  // Label management
  @Patch('labels/:id')
  update(
    @Param('id') labelId: string,
    @Body() dto: UpdateLabelDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.labelsService.update(labelId, user.sub, dto);
  }

  @Delete('labels/:id')
  delete(@Param('id') labelId: string, @CurrentUser() user: AuthUser) {
    return this.labelsService.delete(labelId, user.sub);
  }

  // Task-label management
  @Get('tasks/:taskId/labels')
  getTaskLabels(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.labelsService.getTaskLabels(taskId, user.sub);
  }

  @Post('tasks/:taskId/labels/:labelId')
  addToTask(
    @Param('taskId') taskId: string,
    @Param('labelId') labelId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.labelsService.addToTask(taskId, labelId, user.sub);
  }

  @Delete('tasks/:taskId/labels/:labelId')
  removeFromTask(
    @Param('taskId') taskId: string,
    @Param('labelId') labelId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.labelsService.removeFromTask(taskId, labelId, user.sub);
  }
}
