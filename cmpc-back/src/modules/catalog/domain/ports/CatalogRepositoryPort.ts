import type { CatalogItem, CatalogKind } from '../entities/CatalogItem';

export interface CatalogRepositoryPort {
  list(kind: CatalogKind): Promise<CatalogItem[]>;
  create(kind: CatalogKind, name: string): Promise<CatalogItem>;
  exists(kind: CatalogKind, id: string): Promise<boolean>;
}
