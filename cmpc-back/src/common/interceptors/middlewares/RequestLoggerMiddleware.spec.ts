import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { RequestLoggerMiddleware } from './RequestLoggerMiddleware';

function run(options: { user?: { userId: string }; requestId?: string } = {}) {
  const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  const setHeader = jest.fn();
  const res = Object.assign(new EventEmitter(), { statusCode: 200, setHeader });
  const next = jest.fn() as NextFunction;
  const req = {
    method: 'GET',
    originalUrl: '/books',
    user: options.user,
    headers: options.requestId ? { 'x-request-id': options.requestId } : {},
  } as unknown as Request;

  new RequestLoggerMiddleware().use(req, res as unknown as Response, next);
  res.emit('finish');

  return { log, next, setHeader };
}

describe('RequestLoggerMiddleware', () => {
  afterEach(() => jest.restoreAllMocks());

  it('deja pasar la petición y registra al terminar', () => {
    const { log, next } = run();

    expect(next).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^GET \/books 200 \d+ms id=[\w-]+$/));
  });

  it('incluye el usuario autenticado', () => {
    const { log } = run({ user: { userId: 'u-1' } });
    expect(log).toHaveBeenCalledWith(expect.stringContaining('user=u-1'));
  });

  it('genera un id de petición y lo devuelve en la cabecera', () => {
    const { setHeader, log } = run();

    const id = setHeader.mock.calls[0][1] as string;
    expect(setHeader).toHaveBeenCalledWith('X-Request-Id', expect.stringMatching(/^[0-9a-f-]{36}$/));
    expect(log).toHaveBeenCalledWith(expect.stringContaining(`id=${id}`));
  });

  it('respeta el id que manda un proxy si tiene forma válida', () => {
    const { setHeader } = run({ requestId: 'req-abc12345' });
    expect(setHeader).toHaveBeenCalledWith('X-Request-Id', 'req-abc12345');
  });

  it.each(['corto', 'tiene espacios y\nsalto', 'x'.repeat(65)])(
    'descarta un id inválido (%p) y genera uno propio',
    (requestId) => {
      const { setHeader } = run({ requestId });
      expect(setHeader.mock.calls[0][1]).not.toBe(requestId);
    },
  );
});
