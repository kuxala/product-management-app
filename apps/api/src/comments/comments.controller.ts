import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CurrentUser } from '../common/decorators';
import { CreateCommentDto, UpdateCommentDto, AddReactionDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get('tasks/:taskId/comments')
  findByTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.findByTask(taskId, user.sub);
  }

  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.create(taskId, user.sub, dto);
  }

  @Patch('comments/:id')
  update(
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.update(commentId, user.sub, dto);
  }

  @Delete('comments/:id')
  delete(@Param('id') commentId: string, @CurrentUser() user: AuthUser) {
    return this.commentsService.delete(commentId, user.sub);
  }

  @Post('comments/:id/reactions')
  addReaction(
    @Param('id') commentId: string,
    @Body() dto: AddReactionDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.addReaction(commentId, user.sub, dto);
  }

  @Delete('comments/:id/reactions/:emoji')
  removeReaction(
    @Param('id') commentId: string,
    @Param('emoji') emoji: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.removeReaction(commentId, user.sub, emoji);
  }
}
