import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { lastValueFrom, of, throwError } from 'rxjs';
import type { RecordAudit } from '../../application/use-cases/RecordAudit';
import type { AuditOptions } from './Audit';
import { AuditInterceptor } from './AuditInterceptor';

function setup(options: AuditOptions | undefined, request: Record<string, unknown>) {
  const execute = jest.fn().mockResolvedValue(undefined);
  const reflector = { get: jest.fn().mockReturnValue(options) };
  const interceptor = new AuditInterceptor(
    reflector as unknown as Reflector,
    { execute } as unknown as RecordAudit,
  );
  const context = {
    getHandler: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  const run = (next: CallHandler) => lastValueFrom(interceptor.intercept(context, next));

  return { execute, run };
}

const baseRequest = {
  method: 'POST',
  originalUrl: '/books',
  ip: '1.1.1.1',
  params: {},
  body: {},
};

describe('AuditInterceptor', () => {
  it('no registra nada si el handler no tiene @Audit()', async () => {
    const { execute, run } = setup(undefined, baseRequest);

    await run({ handle: () => of('ok') });

    expect(execute).not.toHaveBeenCalled();
  });

  it('registra la operación exitosa con usuario, entidad y metadatos', async () => {
    const { execute, run } = setup(
      { action: 'CREATE', entity: 'Book' },
      { ...baseRequest, user: { userId: 'u-1', sessionId: 's', role: 'USER' } },
    );

    await run({ handle: () => of({ id: 'b-9', title: 'x' }) });

    expect(execute).toHaveBeenCalledWith({
      userId: 'u-1',
      action: 'CREATE',
      entity: 'Book',
      entityId: 'b-9',
      metadata: {
        outcome: 'SUCCESS',
        method: 'POST',
        path: '/books',
        ip: '1.1.1.1',
      },
    });
  });

  it('tolera una request sin body ni IP', async () => {
    const { execute, run } = setup(
      { action: 'EXPORT', entity: 'Book', bodyFields: ['email'] },
      { method: 'GET', originalUrl: '/books/export', params: {} },
    );

    await run({ handle: () => of(undefined) });

    const entry = execute.mock.calls[0][0];
    expect(entry.metadata.ip).toBeNull();
    expect(entry.metadata).not.toHaveProperty('email');
    expect(entry.userId).toBeNull();
    expect(entry.entityId).toBeNull();
  });

  it('toma el id de la URL cuando la respuesta no trae uno', async () => {
    const { execute, run } = setup(
      { action: 'DELETE', entity: 'Book' },
      { ...baseRequest, method: 'DELETE', params: { id: 'b-3' }, user: { userId: 'u' } },
    );

    await run({ handle: () => of(undefined) });

    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ entityId: 'b-3' }));
  });

  it('en el login saca el usuario de la respuesta (aún no hay request.user)', async () => {
    const { execute, run } = setup({ action: 'LOGIN', entity: 'Auth' }, baseRequest);

    await run({ handle: () => of({ data: { user: { id: 'u-7' } } }) });

    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u-7' }));
  });

  it('guarda solo los campos del body autorizados, nunca la contraseña', async () => {
    const { execute, run } = setup(
      { action: 'LOGIN', entity: 'Auth', bodyFields: ['email'] },
      { ...baseRequest, body: { email: 'a@b.cl', password: 'secreta' } },
    );

    await run({ handle: () => of({}) });

    const metadata = execute.mock.calls[0][0].metadata as Record<string, unknown>;
    expect(metadata.email).toBe('a@b.cl');
    expect(JSON.stringify(metadata)).not.toContain('secreta');
  });

  it('registra los fallos con el status HTTP y vuelve a lanzar el error', async () => {
    const { execute, run } = setup(
      { action: 'LOGIN', entity: 'Auth', bodyFields: ['email'] },
      { ...baseRequest, body: { email: 'a@b.cl' } },
    );

    await expect(
      run({ handle: () => throwError(() => new UnauthorizedException()) }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        metadata: expect.objectContaining({
          outcome: 'FAILED',
          errorStatus: 401,
          email: 'a@b.cl',
        }),
      }),
    );
  });

  it('un error que no es HTTP se registra como 500', async () => {
    const { execute, run } = setup({ action: 'CREATE', entity: 'Book' }, baseRequest);

    await expect(
      run({ handle: () => throwError(() => new Error('boom')) }),
    ).rejects.toThrow('boom');

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ errorStatus: 500 }),
      }),
    );
  });

  it('un 400 de validación también queda auditado', async () => {
    const { execute, run } = setup({ action: 'CREATE', entity: 'Book' }, baseRequest);

    await expect(
      run({ handle: () => throwError(() => new BadRequestException()) }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ errorStatus: 400 }),
      }),
    );
  });
});
