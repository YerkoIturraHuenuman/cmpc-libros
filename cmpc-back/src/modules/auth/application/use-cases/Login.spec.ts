import { UnauthorizedException } from '@nestjs/common';
import { User } from '@/modules/users/domain/entities/User';
import type { UserRepositoryPort } from '@/modules/users/domain/ports/UserRepositoryPort';
import type { PasswordHasherPort } from '../../domain/ports/PasswordHasherPort';
import type { SessionRepositoryPort } from '../../domain/ports/SessionRepositoryPort';
import type { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { Login } from './Login';

describe('Login', () => {
  const user = new User('u-1', 'ana@cmpc.cl', 'Ana', 'USER', 'stored-hash', new Date());

  const users: jest.Mocked<UserRepositoryPort> = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
  };
  const sessions: jest.Mocked<SessionRepositoryPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    rotate: jest.fn(),
    revoke: jest.fn(),
    revokeAllForUser: jest.fn(),
    deleteExpiredForUser: jest.fn(),
  };
  const hasher: jest.Mocked<PasswordHasherPort> = {
    hash: jest.fn(),
    compare: jest.fn(),
  };
  const tokens: jest.Mocked<TokenServicePort> = {
    accessTtlMs: 900_000,
    refreshTtlMs: 604_800_000,
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    hashToken: jest.fn(),
  };

  let login: Login;

  beforeEach(() => {
    jest.resetAllMocks();
    login = new Login(users, sessions, hasher, tokens);
    hasher.hash.mockResolvedValue('dummy-hash');
    tokens.signRefreshToken.mockResolvedValue('refresh-token');
    tokens.signAccessToken.mockResolvedValue('access-token');
    tokens.hashToken.mockReturnValue('refresh-hash');
  });

  const input = {
    email: 'Ana@CMPC.cl',
    password: 'secreta',
    userAgent: 'jest',
    ip: '1.2.3.4',
  };

  it('devuelve tokens y usuario cuando las credenciales son correctas', async () => {
    users.findByEmail.mockResolvedValue(user);
    hasher.compare.mockResolvedValue(true);

    const result = await login.execute(input);

    expect(users.findByEmail).toHaveBeenCalledWith('ana@cmpc.cl');
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user).toMatchObject({ id: 'u-1', email: 'ana@cmpc.cl' });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('crea la sesión con el hash del refresh token, nunca el token', async () => {
    users.findByEmail.mockResolvedValue(user);
    hasher.compare.mockResolvedValue(true);

    await login.execute(input);

    const created = sessions.create.mock.calls[0][0];
    expect(created).toMatchObject({
      userId: 'u-1',
      refreshTokenHash: 'refresh-hash',
      userAgent: 'jest',
      ip: '1.2.3.4',
    });
    expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(tokens.signRefreshToken).toHaveBeenCalledWith({ sub: 'u-1', sid: created.id });
    expect(tokens.signAccessToken).toHaveBeenCalledWith({
      sub: 'u-1',
      sid: created.id,
      role: 'USER',
    });
  });

  it('borra las sesiones vencidas del usuario al iniciar sesión', async () => {
    users.findByEmail.mockResolvedValue(user);
    hasher.compare.mockResolvedValue(true);

    await login.execute(input);

    const [userId, before] = sessions.deleteExpiredForUser.mock.calls[0];
    expect(userId).toBe('u-1');
    expect(Date.now() - before.getTime()).toBeGreaterThan(23 * 60 * 60 * 1000);
    expect(Date.now() - before.getTime()).toBeLessThan(25 * 60 * 60 * 1000);
  });

  it('si la limpieza falla, el login igual funciona', async () => {
    users.findByEmail.mockResolvedValue(user);
    hasher.compare.mockResolvedValue(true);
    sessions.deleteExpiredForUser.mockRejectedValue(new Error('bd lenta'));

    await expect(login.execute(input)).resolves.toMatchObject({ accessToken: 'access-token' });
  });

  it('rechaza una contraseña incorrecta sin crear sesión', async () => {
    users.findByEmail.mockResolvedValue(user);
    hasher.compare.mockResolvedValue(false);

    await expect(login.execute(input)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it('con un email inexistente igual compara contra un hash y falla igual', async () => {
    users.findByEmail.mockResolvedValue(null);
    hasher.compare.mockResolvedValue(false);

    await expect(login.execute(input)).rejects.toThrow('Credenciales inválidas');
    expect(hasher.compare).toHaveBeenCalledWith('secreta', 'dummy-hash');
  });

  it('reutiliza el hash ficticio entre intentos', async () => {
    users.findByEmail.mockResolvedValue(null);
    hasher.compare.mockResolvedValue(false);

    await expect(login.execute(input)).rejects.toThrow();
    await expect(login.execute(input)).rejects.toThrow();

    expect(hasher.hash).toHaveBeenCalledTimes(1);
  });

  it('nunca acepta si el hash compara true pero el usuario no existe', async () => {
    users.findByEmail.mockResolvedValue(null);
    hasher.compare.mockResolvedValue(true);

    await expect(login.execute(input)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
