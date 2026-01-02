import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TimeEntriesService } from './time-entries.service';
import { CurrentUser } from '../common/decorators';
import {
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  StartTimerDto,
} from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class TimeEntriesController {
  constructor(private timeEntriesService: TimeEntriesService) {}

  @Get('tasks/:taskId/time-entries')
  findByTask(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser) {
    return this.timeEntriesService.findByTask(taskId, user.sub);
  }

  @Get('projects/:projectId/time-entries')
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.timeEntriesService.findByProject(projectId, user.sub);
  }

  @Post('time-entries')
  create(@Body() dto: CreateTimeEntryDto, @CurrentUser() user: AuthUser) {
    return this.timeEntriesService.create(user.sub, dto);
  }

  @Patch('time-entries/:id')
  update(
    @Param('id') entryId: string,
    @Body() dto: UpdateTimeEntryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.timeEntriesService.update(entryId, user.sub, dto);
  }

  @Delete('time-entries/:id')
  delete(@Param('id') entryId: string, @CurrentUser() user: AuthUser) {
    return this.timeEntriesService.delete(entryId, user.sub);
  }

  @Post('time-entries/start')
  startTimer(@Body() dto: StartTimerDto, @CurrentUser() user: AuthUser) {
    return this.timeEntriesService.startTimer(user.sub, dto);
  }

  @Post('time-entries/:id/stop')
  stopTimer(@Param('id') entryId: string, @CurrentUser() user: AuthUser) {
    return this.timeEntriesService.stopTimer(entryId, user.sub);
  }

  @Get('time-entries/running')
  getRunningTimer(@CurrentUser() user: AuthUser) {
    return this.timeEntriesService.getRunningTimer(user.sub);
  }
}
