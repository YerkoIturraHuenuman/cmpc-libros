import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { Login } from '../../application/use-cases/Login';
import type { Logout } from '../../application/use-cases/Logout';
import type { RefreshToken } from '../../application/use-cases/RefreshToken';
import type { JwtTokenService } from '../services/JwtTokenService';
import { AuthController } from './AuthController';

const tokenResponse = {
  accessToken: 'access',
  refreshToken: 'refresh',
  user: { id: 'u-1' },
};

function setup(nodeEnv = 'development', cookieSecure?: string) {
  const login = { execute: jest.fn().mockResolvedValue(tokenResponse) };
  const refresh = { execute: jest.fn().mockResolvedValue(tokenResponse) };
  const logout = { execute: jest.fn().mockResolvedValue(undefined) };
  const tokens = { accessTtlMs: 300_000, refreshTtlMs: 300_000 };
  const res = { cookie: jest.fn(), clearCookie: jest.fn() };
  const controller = new AuthController(
    login as unknown as Login,
    refresh as unknown as RefreshToken,
    logout as unknown as Logout,
    tokens as unknown as JwtTokenService,
    {
      get: (key: string) => (key === 'COOKIE_SECURE' ? cookieSecure : nodeEnv),
    } as unknown as ConfigService,
  );
  return { controller, login, refresh, logout, res: res as unknown as Response, cookie: res.cookie, clearCookie: res.clearCookie };
}

describe('AuthController', () => {
  describe('login', () => {
    it('entrega los tokens y los deja en cookies httpOnly', async () => {
      const { controller, login, res, cookie } = setup();
      const req = { headers: { 'user-agent': 'jest' }, ip: '9.9.9.9' } as unknown as Request;

      const result = await controller.loginHandler({ email: 'a@b.cl', password: 'x' }, req, res);

      expect(login.execute).toHaveBeenCalledWith({
        email: 'a@b.cl',
        password: 'x',
        userAgent: 'jest',
        ip: '9.9.9.9',
      });
      expect(result).toBe(tokenResponse);
      expect(cookie).toHaveBeenCalledWith(
        'access_token',
        'access',
        expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 300_000 }),
      );
      expect(cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh',
        expect.objectContaining({ httpOnly: true, path: '/auth', maxAge: 300_000 }),
      );
    });

    it('marca las cookies como Secure solo en producción', async () => {
      const dev = setup('development');
      const prod = setup('production');
      const req = { headers: {} } as unknown as Request;

      await dev.controller.loginHandler({ email: 'a', password: 'b' }, req, dev.res);
      await prod.controller.loginHandler({ email: 'a', password: 'b' }, req, prod.res);

      expect(dev.cookie.mock.calls[0][2]).toMatchObject({ secure: false });
      expect(prod.cookie.mock.calls[0][2]).toMatchObject({ secure: true });
    });
  });

  it('COOKIE_SECURE manda sobre NODE_ENV', async () => {
    const insecureProd = setup('production', 'false');
    const secureDev = setup('development', 'true');
    const emptyOverride = setup('production', '');
    const req = { headers: {} } as unknown as Request;

    await insecureProd.controller.loginHandler({ email: 'a', password: 'b' }, req, insecureProd.res);
    await secureDev.controller.loginHandler({ email: 'a', password: 'b' }, req, secureDev.res);
    await emptyOverride.controller.loginHandler({ email: 'a', password: 'b' }, req, emptyOverride.res);

    expect(insecureProd.cookie.mock.calls[0][2]).toMatchObject({ secure: false });
    expect(secureDev.cookie.mock.calls[0][2]).toMatchObject({ secure: true });
    expect(emptyOverride.cookie.mock.calls[0][2]).toMatchObject({ secure: true });
  });

  describe('refresh', () => {
    it('usa el refresh token del body si viene', async () => {
      const { controller, refresh, res } = setup();
      await controller.refreshHandler({ refreshToken: 'del-body' }, { cookies: {} } as unknown as Request, res);
      expect(refresh.execute).toHaveBeenCalledWith('del-body');
    });

    it('con el token del body devuelve los tokens nuevos', async () => {
      const { controller, res } = setup();
      const result = await controller.refreshHandler(
        { refreshToken: 'del-body' },
        { cookies: {} } as unknown as Request,
        res,
      );
      expect(result).toBe(tokenResponse);
    });

    it('usa la cookie si el body no trae token y no devuelve tokens en el body', async () => {
      const { controller, refresh, res, cookie } = setup();
      const result = await controller.refreshHandler(
        {},
        { cookies: { refresh_token: 'de-cookie' } } as unknown as Request,
        res,
      );
      expect(refresh.execute).toHaveBeenCalledWith('de-cookie');
      expect(cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ user: tokenResponse.user });
      expect(result).not.toHaveProperty('accessToken');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('rechaza si no hay refresh token en ningún lado', async () => {
      const { controller, res } = setup();
      await expect(
        controller.refreshHandler({}, {} as unknown as Request, res),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revoca la sesión y borra ambas cookies', async () => {
      const { controller, logout, res, clearCookie } = setup();

      await controller.logoutHandler({ userId: 'u-1', sessionId: 's-1', role: 'USER' }, res);

      expect(logout.execute).toHaveBeenCalledWith('s-1');
      expect(clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
      expect(clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ path: '/auth' }),
      );
    });
  });
});
