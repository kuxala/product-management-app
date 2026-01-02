import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { CurrentUser } from '../common/decorators';
import {
  CreateChecklistDto,
  UpdateChecklistDto,
  CreateChecklistItemDto,
  UpdateChecklistItemDto,
  ReorderChecklistItemsDto,
} from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class ChecklistsController {
  constructor(private checklistsService: ChecklistsService) {}

  @Get('tasks/:taskId/checklists')
  findByTask(@Param('taskId') taskId: string, @CurrentUser() user: AuthUser) {
    return this.checklistsService.findByTask(taskId, user.sub);
  }

  @Post('tasks/:taskId/checklists')
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateChecklistDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.checklistsService.create(taskId, user.sub, dto);
  }

  @Patch('checklists/:id')
  update(
    @Param('id') checklistId: string,
    @Body() dto: UpdateChecklistDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.checklistsService.update(checklistId, user.sub, dto);
  }

  @Delete('checklists/:id')
  delete(@Param('id') checklistId: string, @CurrentUser() user: AuthUser) {
    return this.checklistsService.delete(checklistId, user.sub);
  }

  @Post('checklists/:id/items')
  addItem(
    @Param('id') checklistId: string,
    @Body() dto: CreateChecklistItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.checklistsService.addItem(checklistId, user.sub, dto);
  }

  @Patch('checklist-items/:id')
  updateItem(
    @Param('id') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.checklistsService.updateItem(itemId, user.sub, dto);
  }

  @Delete('checklist-items/:id')
  deleteItem(@Param('id') itemId: string, @CurrentUser() user: AuthUser) {
    return this.checklistsService.deleteItem(itemId, user.sub);
  }

  @Patch('checklists/:id/reorder')
  reorderItems(
    @Param('id') checklistId: string,
    @Body() dto: ReorderChecklistItemsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.checklistsService.reorderItems(checklistId, user.sub, dto);
  }
}
