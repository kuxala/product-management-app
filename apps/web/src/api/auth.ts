import { api } from './client';
import { LoginDto, RegisterDto, AuthResponse } from '@pm/shared';

export const authApi = {
  login: (d: LoginDto) => api.post<AuthResponse>('/auth/login', d).then(r => r.data),
  register: (d: RegisterDto) => api.post<AuthResponse>('/auth/register', d).then(r => r.data),
  getMe: () => api.get<{ userId: string }>('/auth/me').then(r => r.data),
};
