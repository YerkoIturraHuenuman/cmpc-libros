import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { Session } from '../../../domain/entities/Session';
import type { SessionRepositoryPort } from '../../../domain/ports/SessionRepositoryPort';
import type { TokenServicePort } from '../../../domain/ports/TokenServicePort';
import { JwtAuthGuard } from './JwtAuthGuard';

const activeSession = (userId = 'u-1') =>
  new Session('s-1', userId, 'h', null, null, new Date(Date.now() + 60_000), null, new Date());

function setup() {
  const reflector = { getAllAndOverride: jest.fn() };
  const tokens = { verifyAccessToken: jest.fn() };
  const sessions = { findById: jest.fn() };
  const guard = new JwtAuthGuard(
    reflector as unknown as Reflector,
    tokens as unknown as TokenServicePort,
    sessions as unknown as SessionRepositoryPort,
  );

  const run = (request: Record<string, unknown>) =>
    guard.canActivate({
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext);

  return { guard, reflector, tokens, sessions, run };
}

describe('JwtAuthGuard', () => {
  it('deja pasar las rutas @Public() sin revisar nada', async () => {
    const { reflector, tokens, run } = setup();
    reflector.getAllAndOverride.mockReturnValue(true);

    expect(await run({ headers: {} })).toBe(true);
    expect(tokens.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('rechaza si no hay token', async () => {
    const { run } = setup();
    await expect(run({ headers: {} })).rejects.toThrow('Falta el token');
  });

  it('autentica con Authorization: Bearer y deja el usuario en la request', async () => {
    const { tokens, sessions, run } = setup();
    tokens.verifyAccessToken.mockResolvedValue({ sub: 'u-1', sid: 's-1', role: 'ADMIN' });
    sessions.findById.mockResolvedValue(activeSession());
    const request: Record<string, unknown> = {
      headers: { authorization: 'Bearer token-abc' },
    };

    expect(await run(request)).toBe(true);
    expect(tokens.verifyAccessToken).toHaveBeenCalledWith('token-abc');
    expect(request.user).toEqual({ userId: 'u-1', sessionId: 's-1', role: 'ADMIN' });
  });

  it('autentica con la cookie access_token', async () => {
    const { tokens, sessions, run } = setup();
    tokens.verifyAccessToken.mockResolvedValue({ sub: 'u-1', sid: 's-1', role: 'USER' });
    sessions.findById.mockResolvedValue(activeSession());

    expect(await run({ headers: {}, cookies: { access_token: 'cookie-token' } })).toBe(true);
    expect(tokens.verifyAccessToken).toHaveBeenCalledWith('cookie-token');
  });

  it('ignora esquemas de Authorization que no sean Bearer', async () => {
    const { run } = setup();
    await expect(run({ headers: { authorization: 'Basic abc' } })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza un token inválido o expirado', async () => {
    const { tokens, run } = setup();
    tokens.verifyAccessToken.mockResolvedValue(null);

    await expect(
      run({ headers: { authorization: 'Bearer malo' } }),
    ).rejects.toThrow('Token inválido o expirado');
  });

  it.each([
    ['la sesión no existe', null],
    [
      'la sesión fue revocada',
      new Session('s-1', 'u-1', 'h', null, null, new Date(Date.now() + 60_000), new Date(), new Date()),
    ],
    ['la sesión es de otro usuario', activeSession('otro')],
  ])('rechaza si %s aunque el token sea válido', async (_label, session) => {
    const { tokens, sessions, run } = setup();
    tokens.verifyAccessToken.mockResolvedValue({ sub: 'u-1', sid: 's-1', role: 'USER' });
    sessions.findById.mockResolvedValue(session);

    await expect(
      run({ headers: { authorization: 'Bearer ok' } }),
    ).rejects.toThrow('La sesión ya no es válida');
  });
});
