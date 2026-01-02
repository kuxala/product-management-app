import { Module } from '@nestjs/common';
import {
  WorkspaceInvitationsController,
  InvitationAcceptController,
} from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  controllers: [WorkspaceInvitationsController, InvitationAcceptController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
