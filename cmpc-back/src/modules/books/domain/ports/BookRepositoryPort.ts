import type { Book } from '../entities/Book';

export const BOOK_SORT_FIELDS = [
  'title',
  'price',
  'createdAt',
  'isAvailable',
  'author',
  'publisher',
  'genre',
] as const;

export type BookSortField = (typeof BOOK_SORT_FIELDS)[number];

export interface BookSort {
  field: BookSortField;
  direction: 'asc' | 'desc';
}

export interface BookFilters {
  search?: string;
  genreIds?: string[];
  publisherIds?: string[];
  authorIds?: string[];
  isAvailable?: boolean;
  sort: BookSort[];
}

export interface PageRequest {
  page: number;
  limit: number;
}

export interface CreateBookData {
  title: string;
  price: number;
  isAvailable: boolean;
  imageUrl: string | null;
  authorId: string;
  publisherId: string;
  genreId: string;
}

export type UpdateBookData = Partial<CreateBookData>;

export class StaleBookError extends Error {
  constructor() {
    super('El libro cambió desde que se leyó');
    this.name = 'StaleBookError';
  }
}

export interface BookRepositoryPort {
  create(data: CreateBookData): Promise<Book>;
  update(
    id: string,
    data: UpdateBookData,
    expectedUpdatedAt?: Date,
  ): Promise<Book | null>;
  softDelete(id: string): Promise<boolean>;
  findById(id: string): Promise<Book | null>;
  list(
    filters: BookFilters,
    page: PageRequest,
  ): Promise<{ items: Book[]; total: number }>;
  findAll(filters: BookFilters): Promise<Book[]>;
}
