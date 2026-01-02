import { api } from './client';
import {
  FavoriteWithTarget,
  RecentItemWithTarget,
  CreateFavoriteDto,
  ReorderFavoritesDto,
  RecordViewDto,
} from '@pm/shared';

export const favoritesApi = {
  getAll: () =>
    api.get<FavoriteWithTarget[]>('/favorites').then((r) => r.data),

  add: (data: CreateFavoriteDto) =>
    api.post<FavoriteWithTarget>('/favorites', data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/favorites/${id}`).then((r) => r.data),

  reorder: (data: ReorderFavoritesDto) =>
    api.patch<FavoriteWithTarget[]>('/favorites/reorder', data).then((r) => r.data),

  getRecent: (limit?: number) =>
    api.get<RecentItemWithTarget[]>('/recent', { params: { limit } }).then((r) => r.data),

  recordView: (data: RecordViewDto) =>
    api.post('/recent', data).then((r) => r.data),
};
