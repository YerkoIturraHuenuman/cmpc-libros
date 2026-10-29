import type { PrismaService } from '@/common/database/prisma/PrismaService';
import { CatalogRepositoryPrisma } from './CatalogRepositoryPrisma';

jest.mock('@/common/database/prisma/PrismaService', () => ({
  PrismaService: class {},
}));

const delegate = () => ({
  findMany: jest.fn(),
  create: jest.fn(),
  count: jest.fn(),
});

describe('CatalogRepositoryPrisma', () => {
  const author = delegate();
  const publisher = delegate();
  const genre = delegate();
  const repo = new CatalogRepositoryPrisma({
    author,
    publisher,
    genre,
  } as unknown as PrismaService);

  afterEach(() => jest.resetAllMocks());

  it.each([
    ['authors', author],
    ['publishers', publisher],
    ['genres', genre],
  ] as const)('list(%s) usa la tabla correcta y ordena por nombre', async (kind, table) => {
    table.findMany.mockResolvedValue([{ id: '1', name: 'A' }]);

    const items = await repo.list(kind);

    expect(table.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
    expect(items).toEqual([{ id: '1', name: 'A' }]);
  });

  it('create inserta el nombre y devuelve la entidad', async () => {
    genre.create.mockResolvedValue({ id: '9', name: 'Terror' });

    const item = await repo.create('genres', 'Terror');

    expect(genre.create).toHaveBeenCalledWith({ data: { name: 'Terror' } });
    expect(item).toEqual({ id: '9', name: 'Terror' });
  });

  it('exists es true solo si hay al menos una fila', async () => {
    author.count.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    expect(await repo.exists('authors', 'a-1')).toBe(true);
    expect(await repo.exists('authors', 'a-2')).toBe(false);
    expect(author.count).toHaveBeenCalledWith({ where: { id: 'a-1' } });
  });
});
