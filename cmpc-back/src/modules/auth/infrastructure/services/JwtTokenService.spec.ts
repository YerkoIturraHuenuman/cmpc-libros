import type { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from './JwtTokenService';

const ACCESS_SECRET = 'access-secret-0123456789';
const REFRESH_SECRET = 'refresh-secret-0123456789';

function build(env: Record<string, string> = {}) {
  const values: Record<string, string> = {
    JWT_ACCESS_SECRET: ACCESS_SECRET,
    JWT_REFRESH_SECRET: REFRESH_SECRET,
    ...env,
  };
  const config = {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => values[key],
  } as unknown as ConfigService;
  const jwt = new JwtService();
  return { service: new JwtTokenService(jwt, config), jwt };
}

describe('JwtTokenService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('usa 5m para ambos tokens por defecto', () => {
    const { service } = build();
    expect(service.accessTtlMs).toBe(5 * 60 * 1000);
    expect(service.refreshTtlMs).toBe(5 * 60 * 1000);
  });

  it('respeta la duración configurada', () => {
    const { service } = build({
      JWT_ACCESS_EXPIRES_IN: '30s',
      JWT_REFRESH_EXPIRES_IN: '2h',
    });
    expect(service.accessTtlMs).toBe(30_000);
    expect(service.refreshTtlMs).toBe(7_200_000);
  });

  it('firma y verifica un access token', async () => {
    const { service } = build();
    const token = await service.signAccessToken({ sub: 'u-1', sid: 's-1', role: 'ADMIN' });

    expect(await service.verifyAccessToken(token)).toEqual({
      sub: 'u-1',
      sid: 's-1',
      role: 'ADMIN',
    });
  });

  it('firma y verifica un refresh token', async () => {
    const { service } = build();
    const token = await service.signRefreshToken({ sub: 'u-1', sid: 's-1' });

    expect(await service.verifyRefreshToken(token)).toEqual({ sub: 'u-1', sid: 's-1' });
  });

  it('dos refresh tokens emitidos en el mismo segundo son distintos (jti)', async () => {
    const { service } = build();
    const payload = { sub: 'u-1', sid: 's-1' };

    const [a, b] = await Promise.all([
      service.signRefreshToken(payload),
      service.signRefreshToken(payload),
    ]);

    expect(a).not.toBe(b);
    expect(service.hashToken(a)).not.toBe(service.hashToken(b));
  });

  it('no acepta un refresh token como access token ni al revés', async () => {
    const { service } = build();
    const access = await service.signAccessToken({ sub: 'u', sid: 's', role: 'USER' });
    const refresh = await service.signRefreshToken({ sub: 'u', sid: 's' });

    expect(await service.verifyRefreshToken(access)).toBeNull();
    expect(await service.verifyAccessToken(refresh)).toBeNull();
  });

  it('rechaza tokens firmados con otro secreto o basura', async () => {
    const { service } = build();
    const forged = await new JwtService().signAsync(
      { sub: 'u', sid: 's', role: 'ADMIN', type: 'access' },
      { secret: 'otro-secreto-completamente-distinto' },
    );

    expect(await service.verifyAccessToken(forged)).toBeNull();
    expect(await service.verifyAccessToken('abc.def.ghi')).toBeNull();
    expect(await service.verifyAccessToken('')).toBeNull();
  });

  it('rechaza tokens expirados', async () => {
    const { service } = build();
    const token = await service.signAccessToken({ sub: 'u', sid: 's', role: 'USER' });

    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 60 * 60 * 1000);

    expect(await service.verifyAccessToken(token)).toBeNull();
  });

  it('rechaza un access token con un rol desconocido', async () => {
    const { service, jwt } = build();
    const token = await jwt.signAsync(
      { sub: 'u', sid: 's', role: 'ROOT', type: 'access' },
      { secret: ACCESS_SECRET },
    );

    expect(await service.verifyAccessToken(token)).toBeNull();
  });

  it('rechaza un token sin sub o sid', async () => {
    const { service, jwt } = build();
    const token = await jwt.signAsync(
      { type: 'refresh' },
      { secret: REFRESH_SECRET },
    );

    expect(await service.verifyRefreshToken(token)).toBeNull();
  });

  it('hashToken es determinista y no revela el token', () => {
    const { service } = build();
    const hash = service.hashToken('mi-token');

    expect(hash).toBe(service.hashToken('mi-token'));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('mi-token');
  });
});
