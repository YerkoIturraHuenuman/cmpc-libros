import { request } from '@/services/httpClient';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: AuthUser;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { user } = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      json: credentials,
      skipRefresh: true,
    });
    return user;
  },

  logout(): Promise<void> {
    return request<void>('/auth/logout', { method: 'POST' });
  },
};
