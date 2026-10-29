import type { PrismaService } from '@/common/database/prisma/PrismaService';
import { StaleBookError, type BookFilters } from '../../domain/ports/BookRepositoryPort';
import { BookRepositoryPrisma, EXPORT_LIMIT } from './BookRepositoryPrisma';

jest.mock('@/common/database/prisma/PrismaService', () => ({
  PrismaService: class {},
}));

const row = {
  id: 'b-1',
  title: 'Rayuela',
  price: { toString: () => '12990.50' },
  isAvailable: true,
  imageUrl: null,
  authorId: 'a-1',
  publisherId: 'p-1',
  genreId: 'g-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  deletedAt: null,
  author: { id: 'a-1', name: 'Cortázar' },
  publisher: { id: 'p-1', name: 'Alfaguara' },
  genre: { id: 'g-1', name: 'Novela' },
};

const include = { author: true, publisher: true, genre: true };
const sort = [{ field: 'createdAt', direction: 'desc' }] as BookFilters['sort'];

function setup() {
  const book = {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  };
  const prisma = {
    book,
    $transaction: jest.fn(),
  };
  return {
    book,
    prisma,
    repo: new BookRepositoryPrisma(prisma as unknown as PrismaService),
  };
}

describe('BookRepositoryPrisma', () => {
  it('create devuelve la entidad con el precio como número', async () => {
    const { repo, book } = setup();
    book.create.mockResolvedValue(row);
    const data = {
      title: 'Rayuela',
      price: 12990.5,
      isAvailable: true,
      imageUrl: null,
      authorId: 'a-1',
      publisherId: 'p-1',
      genreId: 'g-1',
    };

    const created = await repo.create(data);

    expect(book.create).toHaveBeenCalledWith({ data, include });
    expect(created.price).toBe(12990.5);
    expect(created.author).toEqual({ id: 'a-1', name: 'Cortázar' });
  });

  describe('update', () => {
    it('actualiza dentro de una transacción si el libro sigue vigente', async () => {
      const { repo, book, prisma } = setup();
      prisma.$transaction.mockImplementation((cb) => cb({ book }));
      book.findFirst.mockResolvedValue({ id: 'b-1' });
      book.update.mockResolvedValue(row);

      const updated = await repo.update('b-1', { price: 5 });

      expect(book.findFirst).toHaveBeenCalledWith({
        where: { id: 'b-1', deletedAt: null },
        select: { id: true, updatedAt: true },
      });
      expect(book.update).toHaveBeenCalledWith({
        where: { id: 'b-1' },
        data: { price: 5 },
        include,
      });
      expect(updated?.id).toBe('b-1');
    });

    it('actualiza si la versión esperada coincide con la guardada', async () => {
      const { repo, book, prisma } = setup();
      prisma.$transaction.mockImplementation((cb) => cb({ book }));
      const stored = new Date('2026-01-02T10:00:00.000Z');
      book.findFirst.mockResolvedValue({ id: 'b-1', updatedAt: stored });
      book.update.mockResolvedValue(row);

      const updated = await repo.update('b-1', { price: 5 }, new Date(stored));

      expect(updated?.id).toBe('b-1');
    });

    it('lanza StaleBookError y no escribe si el libro cambió desde que se leyó', async () => {
      const { repo, book, prisma } = setup();
      prisma.$transaction.mockImplementation((cb) => cb({ book }));
      book.findFirst.mockResolvedValue({
        id: 'b-1',
        updatedAt: new Date('2026-01-02T10:05:00.000Z'),
      });

      await expect(
        repo.update('b-1', { price: 5 }, new Date('2026-01-02T10:00:00.000Z')),
      ).rejects.toBeInstanceOf(StaleBookError);
      expect(book.update).not.toHaveBeenCalled();
    });

    it('devuelve null y no escribe si el libro no existe o fue eliminado', async () => {
      const { repo, book, prisma } = setup();
      prisma.$transaction.mockImplementation((cb) => cb({ book }));
      book.findFirst.mockResolvedValue(null);

      expect(await repo.update('b-1', { price: 5 })).toBeNull();
      expect(book.update).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('marca deletedAt solo si el libro estaba vigente', async () => {
      const { repo, book } = setup();
      book.updateMany.mockResolvedValue({ count: 1 });

      expect(await repo.softDelete('b-1')).toBe(true);
      expect(book.updateMany).toHaveBeenCalledWith({
        where: { id: 'b-1', deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('devuelve false si no había nada que eliminar', async () => {
      const { repo, book } = setup();
      book.updateMany.mockResolvedValue({ count: 0 });
      expect(await repo.softDelete('b-1')).toBe(false);
    });
  });

  describe('findById', () => {
    it('ignora los libros eliminados', async () => {
      const { repo, book } = setup();
      book.findFirst.mockResolvedValue(row);

      expect((await repo.findById('b-1'))?.title).toBe('Rayuela');
      expect(book.findFirst).toHaveBeenCalledWith({
        where: { id: 'b-1', deletedAt: null },
        include,
      });
    });

    it('devuelve null si no existe', async () => {
      const { repo, book } = setup();
      book.findFirst.mockResolvedValue(null);
      expect(await repo.findById('x')).toBeNull();
    });
  });

  describe('list', () => {
    it('cuenta y pagina en la misma transacción', async () => {
      const { repo, book, prisma } = setup();
      prisma.$transaction.mockImplementation((cb) => cb({ book }));
      book.count.mockResolvedValue(42);
      book.findMany.mockResolvedValue([row]);

      const result = await repo.list({ sort }, { page: 3, limit: 10 });

      expect(book.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 20,
        take: 10,
        include,
      });
      expect(book.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
      expect(result.total).toBe(42);
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('limita la cantidad de filas exportadas', async () => {
      const { repo, book } = setup();
      book.findMany.mockResolvedValue([row, row]);

      const result = await repo.findAll({ sort });

      expect(book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: EXPORT_LIMIT }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('buildWhere', () => {
    const { repo } = setup();

    it('siempre excluye los libros eliminados', () => {
      expect(repo.buildWhere({ sort })).toEqual({ deletedAt: null });
    });

    it('arma los filtros por género, editorial, autor y disponibilidad', () => {
      expect(
        repo.buildWhere({
          sort,
          genreIds: ['g1', 'g2'],
          publisherIds: ['p1'],
          authorIds: ['a1'],
          isAvailable: false,
        }),
      ).toEqual({
        deletedAt: null,
        genreId: { in: ['g1', 'g2'] },
        publisherId: { in: ['p1'] },
        authorId: { in: ['a1'] },
        isAvailable: false,
      });
    });

    it('ignora listas vacías', () => {
      expect(repo.buildWhere({ sort, genreIds: [], authorIds: [] })).toEqual({
        deletedAt: null,
      });
    });

    it('busca por título o autor sin distinguir mayúsculas', () => {
      expect(repo.buildWhere({ sort, search: 'cort' }).OR).toEqual([
        { title: { contains: 'cort', mode: 'insensitive' } },
        { author: { name: { contains: 'cort', mode: 'insensitive' } } },
      ]);
    });
  });

  describe('buildOrderBy', () => {
    const { repo } = setup();

    it('traduce campos propios y relaciones, y agrega desempate por id', () => {
      expect(
        repo.buildOrderBy([
          { field: 'title', direction: 'asc' },
          { field: 'author', direction: 'desc' },
          { field: 'publisher', direction: 'asc' },
          { field: 'genre', direction: 'desc' },
          { field: 'price', direction: 'asc' },
        ]),
      ).toEqual([
        { title: 'asc' },
        { author: { name: 'desc' } },
        { publisher: { name: 'asc' } },
        { genre: { name: 'desc' } },
        { price: 'asc' },
        { id: 'asc' },
      ]);
    });

    it('el desempate por id sigue la dirección del último criterio, para poder usar un solo índice', () => {
      expect(repo.buildOrderBy([{ field: 'createdAt', direction: 'desc' }])).toEqual([
        { createdAt: 'desc' },
        { id: 'desc' },
      ]);
    });

    it('sin criterios solo ordena por id', () => {
      expect(repo.buildOrderBy([])).toEqual([{ id: 'asc' }]);
    });
  });
});
