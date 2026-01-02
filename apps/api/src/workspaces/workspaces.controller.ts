import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CurrentUser } from '../common/decorators';
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard';
import { WorkspaceAdminGuard } from '../common/guards/workspace-admin.guard';
import { WorkspaceOwnerGuard } from '../common/guards/workspace-owner.guard';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  InviteWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
} from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.workspacesService.findAll(user.sub);
  }

  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() data: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(user.sub, data);
  }

  @Get('by-slug/:slug')
  async findBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workspacesService.findBySlug(slug, user.sub);
  }

  @Get(':id')
  @UseGuards(WorkspaceMemberGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.workspacesService.findOne(id, user.sub);
  }

  @Patch(':id')
  @UseGuards(WorkspaceMemberGuard, WorkspaceAdminGuard)
  async update(@Param('id') id: string, @Body() data: UpdateWorkspaceDto) {
    return this.workspacesService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(WorkspaceMemberGuard, WorkspaceOwnerGuard)
  async delete(@Param('id') id: string) {
    return this.workspacesService.delete(id);
  }

  @Get(':id/members')
  @UseGuards(WorkspaceMemberGuard)
  async getMembers(@Param('id') id: string) {
    return this.workspacesService.getMembers(id);
  }

  @Post(':id/members')
  @UseGuards(WorkspaceMemberGuard, WorkspaceAdminGuard)
  async inviteMember(
    @Param('id') id: string,
    @Body() data: InviteWorkspaceMemberDto,
  ) {
    return this.workspacesService.inviteMember(id, data);
  }

  @Patch(':id/members/:userId')
  @UseGuards(WorkspaceMemberGuard, WorkspaceAdminGuard)
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Body() data: UpdateWorkspaceMemberDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workspacesService.updateMemberRole(
      id,
      targetUserId,
      data,
      user.sub,
    );
  }

  @Delete(':id/members/:userId')
  @UseGuards(WorkspaceMemberGuard, WorkspaceAdminGuard)
  async removeMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workspacesService.removeMember(id, targetUserId, user.sub);
  }

  @Post(':id/leave')
  @UseGuards(WorkspaceMemberGuard)
  async leaveWorkspace(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.workspacesService.leaveWorkspace(id, user.sub);
  }
}
