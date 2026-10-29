import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/database/prisma/PrismaService';
import {
  CatalogItem,
  type CatalogKind,
} from '../../domain/entities/CatalogItem';
import type { CatalogRepositoryPort } from '../../domain/ports/CatalogRepositoryPort';

interface CatalogRow {
  id: string;
  name: string;
}

interface CatalogDelegate {
  findMany(args: { orderBy: { name: 'asc' } }): Promise<CatalogRow[]>;
  create(args: { data: { name: string } }): Promise<CatalogRow>;
  count(args: { where: { id: string } }): Promise<number>;
}

@Injectable()
export class CatalogRepositoryPrisma implements CatalogRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async list(kind: CatalogKind): Promise<CatalogItem[]> {
    const rows = await this.delegate(kind).findMany({ orderBy: { name: 'asc' } });
    return rows.map((row) => new CatalogItem(row.id, row.name));
  }

  async create(kind: CatalogKind, name: string): Promise<CatalogItem> {
    const row = await this.delegate(kind).create({ data: { name } });
    return new CatalogItem(row.id, row.name);
  }

  async exists(kind: CatalogKind, id: string): Promise<boolean> {
    return (await this.delegate(kind).count({ where: { id } })) > 0;
  }

  private delegate(kind: CatalogKind): CatalogDelegate {
    const delegates = {
      authors: this.prisma.author,
      publishers: this.prisma.publisher,
      genres: this.prisma.genre,
    };
    return delegates[kind] as unknown as CatalogDelegate;
  }
}
