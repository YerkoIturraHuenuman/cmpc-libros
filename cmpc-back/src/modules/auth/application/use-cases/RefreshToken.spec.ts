import { UnauthorizedException } from '@nestjs/common';
import { User } from '@/modules/users/domain/entities/User';
import type { UserRepositoryPort } from '@/modules/users/domain/ports/UserRepositoryPort';
import { Session } from '../../domain/entities/Session';
import type { SessionRepositoryPort } from '../../domain/ports/SessionRepositoryPort';
import type { TokenServicePort } from '../../domain/ports/TokenServicePort';
import { RefreshToken } from './RefreshToken';

describe('RefreshToken', () => {
  const user = new User('u-1', 'ana@cmpc.cl', 'Ana', 'ADMIN', 'h', new Date());
  const activeSession = new Session(
    's-1',
    'u-1',
    'old-hash',
    null,
    null,
    new Date(Date.now() + 60_000),
    null,
    new Date(),
  );

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
  const tokens: jest.Mocked<TokenServicePort> = {
    accessTtlMs: 900_000,
    refreshTtlMs: 604_800_000,
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    hashToken: jest.fn(),
  };

  let useCase: RefreshToken;

  beforeEach(() => {
    jest.resetAllMocks();
    useCase = new RefreshToken(users, sessions, tokens);
    tokens.verifyRefreshToken.mockResolvedValue({ sub: 'u-1', sid: 's-1' });
    tokens.signRefreshToken.mockResolvedValue('new-refresh');
    tokens.signAccessToken.mockResolvedValue('new-access');
    tokens.hashToken.mockImplementation((token) => `hash(${token})`);
    sessions.findById.mockResolvedValue(activeSession);
    users.findById.mockResolvedValue(user);
    sessions.rotate.mockResolvedValue(true);
  });

  it('rota el refresh token y emite un access token nuevo', async () => {
    const result = await useCase.execute('old-refresh');

    expect(sessions.rotate).toHaveBeenCalledWith(
      's-1',
      'hash(old-refresh)',
      'hash(new-refresh)',
      expect.any(Date),
    );
    expect(tokens.signAccessToken).toHaveBeenCalledWith({
      sub: 'u-1',
      sid: 's-1',
      role: 'ADMIN',
    });
    expect(result).toMatchObject({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
  });

  it('rechaza un refresh token inválido', async () => {
    tokens.verifyRefreshToken.mockResolvedValue(null);
    await expect(useCase.execute('x')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.findById).not.toHaveBeenCalled();
  });

  it.each([
    ['la sesión no existe', null],
    [
      'la sesión fue revocada',
      new Session('s-1', 'u-1', 'h', null, null, new Date(Date.now() + 60_000), new Date(), new Date()),
    ],
    [
      'la sesión expiró',
      new Session('s-1', 'u-1', 'h', null, null, new Date(Date.now() - 1), null, new Date()),
    ],
    [
      'la sesión es de otro usuario',
      new Session('s-1', 'otro', 'h', null, null, new Date(Date.now() + 60_000), null, new Date()),
    ],
  ])('rechaza si %s', async (_label, session) => {
    sessions.findById.mockResolvedValue(session);
    await expect(useCase.execute('x')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(sessions.rotate).not.toHaveBeenCalled();
  });

  it('rechaza si el usuario ya no existe', async () => {
    users.findById.mockResolvedValue(null);
    await expect(useCase.execute('x')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('detecta el reuso de un token ya rotado y revoca todas las sesiones', async () => {
    sessions.rotate.mockResolvedValue(false);

    await expect(useCase.execute('old-refresh')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(sessions.revokeAllForUser).toHaveBeenCalledWith('u-1');
    expect(tokens.signAccessToken).not.toHaveBeenCalled();
  });
});
