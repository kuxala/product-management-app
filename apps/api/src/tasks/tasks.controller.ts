import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectOwnerGuard } from '../common/guards/project-owner.guard';
import { CurrentUser } from '../common/decorators';
import {
  CreateTaskDto,
  UpdateTaskDto,
  CreateSubtaskDto,
  MoveTaskDto,
  ReorderTaskDto,
  TaskFilters,
} from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  // Tasks under a project
  @Get('projects/:projectId/tasks')
  @UseGuards(ProjectMemberGuard)
  findAll(
    @Param('projectId') projectId: string,
    @Query() filters: TaskFilters,
  ) {
    return this.tasksService.findAll(projectId, filters);
  }

  @Post('projects/:projectId/tasks')
  @UseGuards(ProjectMemberGuard)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, null, dto);
  }

  // Tasks under a task list
  @Post('lists/:listId/tasks')
  createInList(
    @Param('listId') listId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.createInList(listId, user.sub, dto);
  }

  // Single task operations
  @Get('tasks/:taskId')
  findOne(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser) {
    return this.tasksService.findOne(taskId, user.sub);
  }

  @Patch('tasks/:taskId')
  update(@Param('taskId') taskId: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(taskId, dto);
  }

  @Delete('tasks/:taskId')
  delete(@Param('taskId') taskId: string) {
    return this.tasksService.delete(taskId);
  }

  // Subtasks
  @Post('tasks/:taskId/subtasks')
  createSubtask(
    @Param('taskId') taskId: string,
    @Body() dto: CreateSubtaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.createSubtask(taskId, user.sub, dto);
  }

  // Move task to different list
  @Patch('tasks/:taskId/move')
  move(
    @Param('taskId') taskId: string,
    @Body() dto: MoveTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.move(taskId, user.sub, dto);
  }

  // Reorder task position
  @Patch('tasks/:taskId/reorder')
  reorder(
    @Param('taskId') taskId: string,
    @Body() dto: ReorderTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.reorder(taskId, user.sub, dto);
  }

  // Legacy route for backward compatibility - delete from project context
  @Delete('projects/:projectId/tasks/:taskId')
  @UseGuards(ProjectMemberGuard, ProjectOwnerGuard)
  deleteFromProject(@Param('taskId') taskId: string) {
    return this.tasksService.delete(taskId);
  }

  // Legacy route for backward compatibility - update from project context
  @Patch('projects/:projectId/tasks/:taskId')
  @UseGuards(ProjectMemberGuard)
  updateFromProject(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(taskId, dto);
  }
}
