import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectOwnerGuard } from '../common/guards/project-owner.guard';
import { CreateTaskDto, UpdateTaskDto, TaskFilters } from '@pm/shared';

@Controller('projects/:projectId/tasks')
@UseGuards(ProjectMemberGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  findAll(@Param('projectId') projectId: string, @Query() filters: TaskFilters) {
    return this.tasksService.findAll(projectId, filters);
  }

  @Post()
  create(@Param('projectId') projectId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(projectId, dto);
  }

  @Patch(':taskId')
  update(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(taskId, dto);
  }

  @Delete(':taskId')
  @UseGuards(ProjectOwnerGuard)
  delete(@Param('taskId') taskId: string) {
    return this.tasksService.delete(taskId);
  }
}
