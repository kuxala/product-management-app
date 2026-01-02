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
import { SpacesService } from './spaces.service';
import { CurrentUser } from '../common/decorators';
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard';
import { WorkspaceAdminGuard } from '../common/guards/workspace-admin.guard';
import { CreateSpaceDto, UpdateSpaceDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  // Routes under /workspaces/:workspaceId/spaces
  @Get('workspaces/:workspaceId/spaces')
  @UseGuards(WorkspaceMemberGuard)
  async findAllInWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.spacesService.findAllInWorkspace(workspaceId);
  }

  @Post('workspaces/:workspaceId/spaces')
  @UseGuards(WorkspaceMemberGuard, WorkspaceAdminGuard)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() data: CreateSpaceDto,
  ) {
    return this.spacesService.create(workspaceId, data);
  }

  // Routes under /spaces/:id
  @Get('spaces/:id')
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.spacesService.findOne(id, user.sub);
  }

  @Patch('spaces/:id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateSpaceDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.spacesService.update(id, user.sub, data);
  }

  @Delete('spaces/:id')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.spacesService.delete(id, user.sub);
  }
}
