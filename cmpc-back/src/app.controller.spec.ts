import { ServiceUnavailableException } from '@nestjs/common';
import type { PrismaService } from '@/common/database/prisma/PrismaService';
import { AppController } from './app.controller';

jest.mock('@/common/database/prisma/PrismaService', () => ({ PrismaService: class {} }));

describe('AppController', () => {
  const queryRaw = jest.fn();
  const controller = new AppController({ $queryRaw: queryRaw } as unknown as PrismaService);

  beforeEach(() => queryRaw.mockReset());

  it('health devuelve status ok sin consultar la base de datos', () => {
    expect(controller.health()).toEqual({ status: 'ok' });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it('ready confirma que la base de datos responde', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.ready()).resolves.toEqual({ status: 'ok', database: 'up' });
  });

  it('ready responde 503 si la base de datos no responde', async () => {
    queryRaw.mockRejectedValue(new Error('conexión rechazada'));

    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
