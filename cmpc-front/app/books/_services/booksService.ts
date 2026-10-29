import {
  request,
  requestBlob,
  requestPage,
  type Page,
} from '@/services/httpClient';

export interface BookRelation {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  title: string;
  price: number;
  isAvailable: boolean;
  imageUrl: string | null;
  author: BookRelation;
  publisher: BookRelation;
  genre: BookRelation;
  createdAt: string;
  updatedAt: string;
}

export type SortField =
  | 'title'
  | 'price'
  | 'createdAt'
  | 'isAvailable'
  | 'author'
  | 'publisher'
  | 'genre';

export type SortDirection = 'asc' | 'desc';

export interface BookSort {
  field: SortField;
  direction: SortDirection;
}

export interface BookFiltersParams {
  search?: string;
  genreIds?: string[];
  publisherIds?: string[];
  authorIds?: string[];
  isAvailable?: boolean;
  sort?: BookSort[];
}

export interface BookListParams extends BookFiltersParams {
  page?: number;
  limit?: number;
}

export function toQueryString(params: BookListParams): string {
  const query = new URLSearchParams();

  if (params.search) query.set('search', params.search);
  if (params.genreIds?.length) query.set('genreIds', params.genreIds.join(','));
  if (params.publisherIds?.length) {
    query.set('publisherIds', params.publisherIds.join(','));
  }
  if (params.authorIds?.length) query.set('authorIds', params.authorIds.join(','));
  if (params.isAvailable !== undefined) {
    query.set('isAvailable', String(params.isAvailable));
  }
  if (params.sort?.length) {
    query.set(
      'sort',
      params.sort.map(({ field, direction }) => `${field}:${direction}`).join(','),
    );
  }
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  return query.toString();
}

export const booksService = {
  list(params: BookListParams, signal?: AbortSignal): Promise<Page<Book>> {
    return requestPage<Book>(`/books?${toQueryString(params)}`, { signal });
  },

  get(id: string): Promise<Book> {
    return request<Book>(`/books/${id}`);
  },

  create(body: FormData): Promise<Book> {
    return request<Book>('/books', { method: 'POST', body });
  },

  update(id: string, body: FormData): Promise<Book> {
    return request<Book>(`/books/${id}`, { method: 'PATCH', body });
  },

  remove(id: string): Promise<void> {
    return request<void>(`/books/${id}`, { method: 'DELETE' });
  },

  exportCsv(params: BookFiltersParams): Promise<Blob> {
    return requestBlob(`/books/export?${toQueryString(params)}`);
  },
};
