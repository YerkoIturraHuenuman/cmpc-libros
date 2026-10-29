import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma/PrismaService';
import type { Prisma } from '@/common/database/prisma/generated/client';
import { Book } from '../../domain/entities/Book';
import {
  StaleBookError,
  type BookFilters,
  type BookRepositoryPort,
  type BookSort,
  type CreateBookData,
  type PageRequest,
  type UpdateBookData,
} from '../../domain/ports/BookRepositoryPort';

const INCLUDE = { author: true, publisher: true, genre: true } as const;

type BookRow = Prisma.BookGetPayload<{ include: typeof INCLUDE }>;

export const EXPORT_LIMIT = 50_000;

@Injectable()
export class BookRepositoryPrisma implements BookRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBookData): Promise<Book> {
    const row = await this.prisma.book.create({ data, include: INCLUDE });
    return this.toEntity(row);
  }

  async update(
    id: string,
    data: UpdateBookData,
    expectedUpdatedAt?: Date,
  ): Promise<Book | null> {
    const row = await this.prisma.$transaction(async (tx) => {
      const current = await tx.book.findFirst({
        where: { id, deletedAt: null },
        select: { id: true, updatedAt: true },
      });
      if (!current) return null;
      if (
        expectedUpdatedAt &&
        current.updatedAt.getTime() !== expectedUpdatedAt.getTime()
      ) {
        throw new StaleBookError();
      }
      return tx.book.update({ where: { id }, data, include: INCLUDE });
    });
    return row ? this.toEntity(row) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.prisma.book.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count > 0;
  }

  async findById(id: string): Promise<Book | null> {
    const row = await this.prisma.book.findFirst({
      where: { id, deletedAt: null },
      include: INCLUDE,
    });
    return row ? this.toEntity(row) : null;
  }

  async list(
    filters: BookFilters,
    page: PageRequest,
  ): Promise<{ items: Book[]; total: number }> {
    const where = this.buildWhere(filters);

    const { total, rows } = await this.prisma.$transaction(async (tx) => {
      const total = await tx.book.count({ where });
      const rows = await tx.book.findMany({
        where,
        orderBy: this.buildOrderBy(filters.sort),
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        include: INCLUDE,
      });
      return { total, rows };
    });

    return { items: rows.map((row) => this.toEntity(row)), total };
  }

  async findAll(filters: BookFilters): Promise<Book[]> {
    const rows = await this.prisma.book.findMany({
      where: this.buildWhere(filters),
      orderBy: this.buildOrderBy(filters.sort),
      take: EXPORT_LIMIT,
      include: INCLUDE,
    });
    return rows.map((row) => this.toEntity(row));
  }

  buildWhere(filters: BookFilters): Prisma.BookWhereInput {
    const where: Prisma.BookWhereInput = { deletedAt: null };

    if (filters.genreIds?.length) where.genreId = { in: filters.genreIds };
    if (filters.publisherIds?.length) {
      where.publisherId = { in: filters.publisherIds };
    }
    if (filters.authorIds?.length) where.authorId = { in: filters.authorIds };
    if (filters.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { author: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  buildOrderBy(sort: BookSort[]): Prisma.BookOrderByWithRelationInput[] {
    const orderBy = sort.map(({ field, direction }) => {
      switch (field) {
        case 'author':
          return { author: { name: direction } };
        case 'publisher':
          return { publisher: { name: direction } };
        case 'genre':
          return { genre: { name: direction } };
        default:
          return { [field]: direction };
      }
    }) as Prisma.BookOrderByWithRelationInput[];

    const tieBreak = sort.at(-1)?.direction ?? 'asc';

    return [...orderBy, { id: tieBreak }];
  }

  private toEntity(row: BookRow): Book {
    return new Book(
      row.id,
      row.title,
      Number(row.price.toString()),
      row.isAvailable,
      row.imageUrl,
      { id: row.author.id, name: row.author.name },
      { id: row.publisher.id, name: row.publisher.name },
      { id: row.genre.id, name: row.genre.name },
      row.createdAt,
      row.updatedAt,
    );
  }
}
