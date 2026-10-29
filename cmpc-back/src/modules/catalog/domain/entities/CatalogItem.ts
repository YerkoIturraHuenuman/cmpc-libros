export const CATALOG_KINDS = ['authors', 'publishers', 'genres'] as const;

export type CatalogKind = (typeof CATALOG_KINDS)[number];

export class CatalogItem {
  constructor(
    readonly id: string,
    readonly name: string,
  ) {}
}
