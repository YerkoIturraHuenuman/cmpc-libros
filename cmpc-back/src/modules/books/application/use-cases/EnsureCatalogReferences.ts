import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CATALOG_REPOSITORY } from '@/common/config/di-tokens';
import type { CatalogRepositoryPort } from '@/modules/catalog/domain/ports/CatalogRepositoryPort';

export interface CatalogReferences {
  authorId?: string;
  publisherId?: string;
  genreId?: string;
}

@Injectable()
export class EnsureCatalogReferences {
  constructor(
    @Inject(CATALOG_REPOSITORY) private readonly catalog: CatalogRepositoryPort,
  ) {}

  async execute(refs: CatalogReferences): Promise<void> {
    const checks = [
      { kind: 'authors', id: refs.authorId, label: 'autor' },
      { kind: 'publishers', id: refs.publisherId, label: 'editorial' },
      { kind: 'genres', id: refs.genreId, label: 'género' },
    ] as const;

    for (const { kind, id, label } of checks) {
      if (id !== undefined && !(await this.catalog.exists(kind, id))) {
        throw new BadRequestException(`El ${label} indicado no existe`);
      }
    }
  }
}
