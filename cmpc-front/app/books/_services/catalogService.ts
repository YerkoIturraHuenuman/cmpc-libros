import { request } from '@/services/httpClient';

export type CatalogKind = 'authors' | 'publishers' | 'genres';

export interface CatalogItem {
  id: string;
  name: string;
}

export const catalogService = {
  list(kind: CatalogKind, signal?: AbortSignal): Promise<CatalogItem[]> {
    return request<CatalogItem[]>(`/catalog/${kind}`, { signal });
  },

  create(kind: CatalogKind, name: string): Promise<CatalogItem> {
    return request<CatalogItem>(`/catalog/${kind}`, { method: 'POST', json: { name } });
  },
};
