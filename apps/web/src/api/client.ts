import axios from 'axios';
import { storage } from '../utils/storage';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = storage.getAccessToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken: storage.getRefreshToken(),
        });
        storage.setTokens(data.accessToken, data.refreshToken);
        return api(err.config);
      } catch {
        storage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const getError = (e: unknown) => {
  const error = e as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || 'Error occurred';
};
