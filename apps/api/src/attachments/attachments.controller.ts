import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { CurrentUser } from '../common/decorators';

interface AuthUser {
  sub: string;
}

interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller()
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  @Get('tasks/:taskId/attachments')
  findByTask(
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.attachmentsService.findByTask(taskId, user.sub);
  }

  @Post('tasks/:taskId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('taskId') taskId: string,
    @UploadedFile() file: UploadedFile,
    @CurrentUser() user: AuthUser,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.attachmentsService.create(taskId, user.sub, file);
  }

  @Get('attachments/:id')
  findOne(@Param('id') attachmentId: string, @CurrentUser() user: AuthUser) {
    return this.attachmentsService.findOne(attachmentId, user.sub);
  }

  @Delete('attachments/:id')
  delete(@Param('id') attachmentId: string, @CurrentUser() user: AuthUser) {
    return this.attachmentsService.delete(attachmentId, user.sub);
  }
}
