import { request } from '@/services/httpClient';
import { authService } from './authService';

jest.mock('@/services/httpClient');

const user = {
  id: 'u1',
  email: 'a@b.cl',
  name: 'Admin',
  role: 'ADMIN' as const,
  createdAt: '2026-01-01',
};

describe('authService', () => {
  beforeEach(() => jest.resetAllMocks());

  it('login devuelve solo el usuario y no intenta renovar la sesión', async () => {
    jest.mocked(request).mockResolvedValue({ user, accessToken: 'x', refreshToken: 'y' });

    await expect(authService.login({ email: 'a@b.cl', password: 'p' })).resolves.toEqual(user);

    expect(request).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      json: { email: 'a@b.cl', password: 'p' },
      skipRefresh: true,
    });
  });

  it('logout llama al endpoint', async () => {
    jest.mocked(request).mockResolvedValue(undefined);

    await authService.logout();

    expect(request).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
  });
});
