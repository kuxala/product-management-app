import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { storage } from '../utils/storage';
import { User, LoginDto, RegisterDto } from '@pm/shared';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storage.getAccessToken()) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then((data) => setUser(data as unknown as User))
      .catch(() => storage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (d: LoginDto) => {
    const r = await authApi.login(d);
    storage.setTokens(r.accessToken, r.refreshToken);
    setUser(r.user);
  };

  const register = async (d: RegisterDto) => {
    const r = await authApi.register(d);
    storage.setTokens(r.accessToken, r.refreshToken);
    setUser(r.user);
  };

  const logout = () => {
    storage.clear();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const context = useContext(Ctx);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
