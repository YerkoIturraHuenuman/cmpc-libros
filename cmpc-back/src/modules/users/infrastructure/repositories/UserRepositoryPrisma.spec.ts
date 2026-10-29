import type { PrismaService } from '@/common/database/prisma/PrismaService';
import { UserRepositoryPrisma } from './UserRepositoryPrisma';

jest.mock('@/common/database/prisma/PrismaService', () => ({
  PrismaService: class {},
}));

const row = {
  id: '1',
  email: 'a@b.cl',
  name: 'Ana',
  role: 'ADMIN' as const,
  passwordHash: 'h',
  createdAt: new Date('2026-01-01'),
};

describe('UserRepositoryPrisma', () => {
  const findUnique = jest.fn();
  const repo = new UserRepositoryPrisma({ user: { findUnique } } as unknown as PrismaService);

  afterEach(() => jest.resetAllMocks());

  it('findById mapea la fila a entidad', async () => {
    findUnique.mockResolvedValue(row);

    const user = await repo.findById('1');

    expect(findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(user?.isAdmin()).toBe(true);
    expect(user?.email).toBe('a@b.cl');
  });

  it('findById devuelve null si no existe', async () => {
    findUnique.mockResolvedValue(null);
    expect(await repo.findById('x')).toBeNull();
  });

  it('findByEmail mapea la fila a entidad', async () => {
    findUnique.mockResolvedValue(row);
    expect((await repo.findByEmail('a@b.cl'))?.name).toBe('Ana');
  });

  it('findByEmail devuelve null si no existe', async () => {
    findUnique.mockResolvedValue(null);
    expect(await repo.findByEmail('x@y.cl')).toBeNull();
    expect(findUnique).toHaveBeenCalledWith({ where: { email: 'x@y.cl' } });
  });
});
