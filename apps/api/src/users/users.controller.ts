import { Controller, Get, Patch, Body, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators';
import { UpdateUserProfileDto, ChangePasswordDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() data: UpdateUserProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, data);
  }

  @Post('me/change-password')
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() data: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.sub, data);
  }
}
