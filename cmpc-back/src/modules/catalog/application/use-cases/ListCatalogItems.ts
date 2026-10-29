import { Inject, Injectable } from '@nestjs/common';
import { CATALOG_REPOSITORY } from '@/common/config/di-tokens';
import type { CatalogKind } from '../../domain/entities/CatalogItem';
import type { CatalogRepositoryPort } from '../../domain/ports/CatalogRepositoryPort';
import { CatalogItemResponseDTO } from '../dto/CatalogDTO';

@Injectable()
export class ListCatalogItems {
  constructor(
    @Inject(CATALOG_REPOSITORY) private readonly catalog: CatalogRepositoryPort,
  ) {}

  async execute(kind: CatalogKind): Promise<CatalogItemResponseDTO[]> {
    const items = await this.catalog.list(kind);
    return items.map((item) => CatalogItemResponseDTO.from(item));
  }
}
