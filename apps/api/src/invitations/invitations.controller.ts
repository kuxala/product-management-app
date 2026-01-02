import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CurrentUser, Public } from '../common/decorators';
import { WorkspaceMemberGuard } from '../common/guards/workspace-member.guard';
import { WorkspaceAdminGuard } from '../common/guards/workspace-admin.guard';
import { CreateInvitationDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller('workspaces/:workspaceId/invitations')
export class WorkspaceInvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @UseGuards(WorkspaceMemberGuard)
  async getAll(@Param('workspaceId') workspaceId: string) {
    return this.invitationsService.getAll(workspaceId);
  }

  @Post()
  @UseGuards(WorkspaceMemberGuard, WorkspaceAdminGuard)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Body() data: CreateInvitationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invitationsService.create(workspaceId, data, user.sub);
  }

  @Post(':invitationId/resend')
  @UseGuards(WorkspaceMemberGuard, WorkspaceAdminGuard)
  async resend(@Param('invitationId') invitationId: string) {
    return this.invitationsService.resend(invitationId);
  }

  @Delete(':invitationId')
  @UseGuards(WorkspaceMemberGuard, WorkspaceAdminGuard)
  async cancel(@Param('invitationId') invitationId: string) {
    return this.invitationsService.cancel(invitationId);
  }
}

@Controller('invitations')
export class InvitationAcceptController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Public()
  @Get(':token')
  async getByToken(@Param('token') token: string) {
    return this.invitationsService.getByToken(token);
  }

  @Post(':token/accept')
  async accept(@Param('token') token: string, @CurrentUser() user: AuthUser) {
    return this.invitationsService.accept(token, user.sub);
  }
}
