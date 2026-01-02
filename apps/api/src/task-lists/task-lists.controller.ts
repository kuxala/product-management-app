import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TaskListsService } from './task-lists.service';
import { CurrentUser } from '../common/decorators';
import { CreateTaskListDto, UpdateTaskListDto, ReorderTaskListDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class TaskListsController {
  constructor(private readonly taskListsService: TaskListsService) {}

  // Routes under /projects/:projectId/lists
  @Get('projects/:projectId/lists')
  async findAllInProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.taskListsService.findAllInProject(projectId, user.sub);
  }

  @Post('projects/:projectId/lists')
  async create(
    @Param('projectId') projectId: string,
    @Body() data: CreateTaskListDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.taskListsService.create(projectId, user.sub, data);
  }

  // Routes under /lists/:id
  @Get('lists/:id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.taskListsService.findOne(id, user.sub);
  }

  @Patch('lists/:id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateTaskListDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.taskListsService.update(id, user.sub, data);
  }

  @Delete('lists/:id')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.taskListsService.delete(id, user.sub);
  }

  @Patch('lists/:id/reorder')
  async reorder(
    @Param('id') id: string,
    @Body() data: ReorderTaskListDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.taskListsService.reorder(id, user.sub, data);
  }
}
