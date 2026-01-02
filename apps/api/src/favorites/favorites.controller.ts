import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../common/decorators';
import { CreateFavoriteDto, ReorderFavoritesDto, RecordViewDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // Favorites
  @Get('favorites')
  findAll(@CurrentUser() user: AuthUser) {
    return this.favoritesService.findAll(user.sub);
  }

  @Post('favorites')
  create(@CurrentUser() user: AuthUser, @Body() data: CreateFavoriteDto) {
    return this.favoritesService.create(user.sub, data);
  }

  @Delete('favorites/:id')
  delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.favoritesService.delete(id, user.sub);
  }

  @Patch('favorites/reorder')
  reorder(@CurrentUser() user: AuthUser, @Body() data: ReorderFavoritesDto) {
    return this.favoritesService.reorder(user.sub, data);
  }

  // Recent items
  @Get('recent')
  getRecent(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
  ) {
    return this.favoritesService.getRecent(
      user.sub,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post('recent')
  recordView(@CurrentUser() user: AuthUser, @Body() data: RecordViewDto) {
    return this.favoritesService.recordView(user.sub, data);
  }
}
