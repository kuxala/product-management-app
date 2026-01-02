import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CustomFieldsService } from './custom-fields.service';
import { CurrentUser } from '../common/decorators';
import {
  CreateCustomFieldDto,
  UpdateCustomFieldDto,
  SetCustomFieldValueDto,
} from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class CustomFieldsController {
  constructor(private customFieldsService: CustomFieldsService) {}

  // Space-level custom fields
  @Get('spaces/:spaceId/custom-fields')
  findBySpace(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customFieldsService.findBySpace(spaceId, user.sub);
  }

  @Post('spaces/:spaceId/custom-fields')
  createForSpace(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateCustomFieldDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customFieldsService.createForSpace(spaceId, user.sub, dto);
  }

  // Project-level custom fields
  @Get('projects/:projectId/custom-fields')
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customFieldsService.findByProject(projectId, user.sub);
  }

  @Post('projects/:projectId/custom-fields')
  createForProject(
    @Param('projectId') projectId: string,
    @Body() dto: CreateCustomFieldDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customFieldsService.createForProject(projectId, user.sub, dto);
  }

  // Custom field management
  @Patch('custom-fields/:id')
  update(
    @Param('id') fieldId: string,
    @Body() dto: UpdateCustomFieldDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customFieldsService.update(fieldId, user.sub, dto);
  }

  @Delete('custom-fields/:id')
  delete(@Param('id') fieldId: string, @CurrentUser() user: AuthUser) {
    return this.customFieldsService.delete(fieldId, user.sub);
  }

  // Task field values
  @Get('tasks/:taskId/custom-fields')
  getTaskFieldValues(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customFieldsService.getTaskFieldValues(taskId, user.sub);
  }

  @Put('tasks/:taskId/custom-fields/:fieldId')
  setTaskFieldValue(
    @Param('taskId') taskId: string,
    @Param('fieldId') fieldId: string,
    @Body() dto: SetCustomFieldValueDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customFieldsService.setTaskFieldValue(
      taskId,
      fieldId,
      user.sub,
      dto,
    );
  }

  @Delete('tasks/:taskId/custom-fields/:fieldId')
  clearTaskFieldValue(
    @Param('taskId') taskId: string,
    @Param('fieldId') fieldId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.customFieldsService.clearTaskFieldValue(
      taskId,
      fieldId,
      user.sub,
    );
  }
}
