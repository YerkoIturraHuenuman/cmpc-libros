import type {
  BookFilters,
  BookSort,
  BookSortField,
} from '../../domain/ports/BookRepositoryPort';
import type { BookFiltersQueryDTO } from './ListBooksQueryDTO';

const DEFAULT_SORT: BookSort[] = [{ field: 'createdAt', direction: 'desc' }];

export function parseSort(sort?: string): BookSort[] {
  if (!sort) return DEFAULT_SORT;

  const seen = new Set<BookSortField>();
  const result: BookSort[] = [];

  for (const part of sort.split(',')) {
    const [field, direction] = part.split(':') as [
      BookSortField,
      BookSort['direction'],
    ];
    if (!seen.has(field)) {
      seen.add(field);
      result.push({ field, direction });
    }
  }

  return result;
}

export function toBookFilters(query: BookFiltersQueryDTO): BookFilters {
  return {
    search: query.search || undefined,
    genreIds: query.genreIds,
    publisherIds: query.publisherIds,
    authorIds: query.authorIds,
    isAvailable: query.isAvailable,
    sort: parseSort(query.sort),
  };
}
