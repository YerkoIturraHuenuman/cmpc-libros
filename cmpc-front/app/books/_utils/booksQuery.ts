import type { BookFiltersParams, BookListParams, BookSort } from '../_services/booksService';

export const ALL = 'all';
export const PAGE_SIZE = 10;

export type Availability = typeof ALL | 'true' | 'false';

export interface BooksQuery {
  search: string;
  genreIds: string[];
  publisherIds: string[];
  authorIds: string[];
  availability: Availability;
  sort: BookSort[];
  page: number;
}

export const DEFAULT_QUERY: BooksQuery = {
  search: '',
  genreIds: [],
  publisherIds: [],
  authorIds: [],
  availability: ALL,
  sort: [],
  page: 1,
};

export function hasActiveFilters(query: BooksQuery): boolean {
  return (
    query.search !== '' ||
    query.genreIds.length > 0 ||
    query.publisherIds.length > 0 ||
    query.authorIds.length > 0 ||
    query.availability !== ALL
  );
}

export function toFiltersParams(query: BooksQuery): BookFiltersParams {
  return {
    search: query.search.trim() || undefined,
    genreIds: query.genreIds.length ? query.genreIds : undefined,
    publisherIds: query.publisherIds.length ? query.publisherIds : undefined,
    authorIds: query.authorIds.length ? query.authorIds : undefined,
    isAvailable: query.availability === ALL ? undefined : query.availability === 'true',
    sort: query.sort,
  };
}

export function toListParams(query: BooksQuery): BookListParams {
  return { ...toFiltersParams(query), page: query.page, limit: PAGE_SIZE };
}
