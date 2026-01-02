import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { DependenciesService } from './dependencies.service';
import { CurrentUser } from '../common/decorators';
import { CreateDependencyDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class DependenciesController {
  constructor(private dependenciesService: DependenciesService) {}

  @Get('tasks/:taskId/dependencies')
  findByTask(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser) {
    return this.dependenciesService.findByTask(taskId, user.sub);
  }

  @Post('tasks/:taskId/dependencies')
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateDependencyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dependenciesService.create(taskId, user.sub, dto);
  }

  @Delete('dependencies/:id')
  delete(@Param('id') dependencyId: string, @CurrentUser() user: AuthUser) {
    return this.dependenciesService.delete(dependencyId, user.sub);
  }
}
