import { api } from './client';
import { User, UpdateUserProfileDto, ChangePasswordDto } from '@pm/shared';

export const usersApi = {
  getProfile: () => api.get<User>('/users/me').then((r) => r.data),

  updateProfile: (data: UpdateUserProfileDto) =>
    api.patch<User>('/users/me', data).then((r) => r.data),

  changePassword: (data: ChangePasswordDto) =>
    api.post<{ message: string }>('/users/me/change-password', data).then((r) => r.data),
};
