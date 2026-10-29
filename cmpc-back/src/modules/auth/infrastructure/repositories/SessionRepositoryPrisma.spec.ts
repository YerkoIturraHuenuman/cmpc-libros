import type { PrismaService } from '@/common/database/prisma/PrismaService';
import { SessionRepositoryPrisma } from './SessionRepositoryPrisma';

jest.mock('@/common/database/prisma/PrismaService', () => ({
  PrismaService: class {},
}));

const row = {
  id: 's-1',
  userId: 'u-1',
  refreshTokenHash: 'h',
  userAgent: 'jest',
  ip: '1.1.1.1',
  expiresAt: new Date(Date.now() + 60_000),
  revokedAt: null,
  createdAt: new Date(),
};

describe('SessionRepositoryPrisma', () => {
  const session = {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };
  const repo = new SessionRepositoryPrisma({ session } as unknown as PrismaService);

  afterEach(() => jest.resetAllMocks());

  it('create guarda y devuelve la entidad', async () => {
    session.create.mockResolvedValue(row);

    const created = await repo.create({
      id: 's-1',
      userId: 'u-1',
      refreshTokenHash: 'h',
      userAgent: 'jest',
      ip: '1.1.1.1',
      expiresAt: row.expiresAt,
    });

    expect(created.isActive()).toBe(true);
    expect(session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ id: 's-1', refreshTokenHash: 'h' }),
    });
  });

  it('findById devuelve null si no existe', async () => {
    session.findUnique.mockResolvedValue(null);
    expect(await repo.findById('x')).toBeNull();

    session.findUnique.mockResolvedValue(row);
    expect((await repo.findById('s-1'))?.userId).toBe('u-1');
  });

  describe('rotate', () => {
    it('es un compare-and-swap sobre el hash esperado', async () => {
      session.updateMany.mockResolvedValue({ count: 1 });
      const expiresAt = new Date();

      expect(await repo.rotate('s-1', 'old', 'new', expiresAt)).toBe(true);
      expect(session.updateMany).toHaveBeenCalledWith({
        where: {
          id: 's-1',
          refreshTokenHash: 'old',
          revokedAt: null,
          expiresAt: { gt: expect.any(Date) },
        },
        data: { refreshTokenHash: 'new', expiresAt },
      });
    });

    it('devuelve false si el hash ya cambió (token reutilizado)', async () => {
      session.updateMany.mockResolvedValue({ count: 0 });
      expect(await repo.rotate('s-1', 'old', 'new', new Date())).toBe(false);
    });
  });

  it('revoke marca solo la sesión indicada', async () => {
    await repo.revoke('s-1');
    expect(session.updateMany).toHaveBeenCalledWith({
      where: { id: 's-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('revokeAllForUser marca todas las sesiones activas del usuario', async () => {
    await repo.revokeAllForUser('u-1');
    expect(session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('deleteExpiredForUser borra las sesiones vencidas o revocadas antes del corte', async () => {
    const before = new Date('2026-01-01T00:00:00Z');

    await repo.deleteExpiredForUser('u-1', before);

    expect(session.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'u-1',
        OR: [{ expiresAt: { lt: before } }, { revokedAt: { lt: before } }],
      },
    });
  });
});
