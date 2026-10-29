import type { ConfigService } from '@nestjs/config';
import { PrismaService } from './PrismaService';

const connect = jest.fn();
const disconnect = jest.fn();
const adapterArgs: unknown[] = [];

jest.mock('./generated/client', () => ({
  PrismaClient: class {
    constructor(public options: unknown) {}
    $connect = connect;
    $disconnect = disconnect;
  },
}));
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {
    constructor(options: unknown) {
      adapterArgs.push(options);
    }
  },
}));

describe('PrismaService', () => {
  const get = jest.fn();
  const config = {
    getOrThrow: jest.fn().mockReturnValue('postgresql://u:p@localhost/db'),
    get,
  } as unknown as ConfigService;

  beforeEach(() => {
    adapterArgs.length = 0;
    get.mockReset();
  });

  it('crea el cliente con el adaptador de Postgres y la DATABASE_URL', () => {
    new PrismaService(config);

    expect(config.getOrThrow).toHaveBeenCalledWith('DATABASE_URL');
    expect(adapterArgs[0]).toMatchObject({ connectionString: 'postgresql://u:p@localhost/db' });
  });

  it('el pool tiene 10 conexiones por defecto y DB_POOL_MAX lo cambia', () => {
    new PrismaService(config);
    get.mockReturnValue('25');
    new PrismaService(config);

    expect(adapterArgs[0]).toMatchObject({ max: 10, connectionTimeoutMillis: 5_000 });
    expect(adapterArgs[1]).toMatchObject({ max: 25 });
  });

  it('conecta al iniciar el módulo y desconecta al destruirlo', async () => {
    const service = new PrismaService(config);

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
