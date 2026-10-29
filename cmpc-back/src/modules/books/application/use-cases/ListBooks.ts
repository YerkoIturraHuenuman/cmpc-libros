import { Inject, Injectable } from '@nestjs/common';
import { BOOK_REPOSITORY } from '@/common/config/di-tokens';
import { PaginatedResult } from '@/common/dto/PaginatedResponseDTO';
import type { BookRepositoryPort } from '../../domain/ports/BookRepositoryPort';
import { BookResponseDTO } from '../dto/BookResponseDTO';
import type { ListBooksQueryDTO } from '../dto/ListBooksQueryDTO';
import { toBookFilters } from '../dto/toBookFilters';

@Injectable()
export class ListBooks {
  constructor(
    @Inject(BOOK_REPOSITORY) private readonly books: BookRepositoryPort,
  ) {}

  async execute(query: ListBooksQueryDTO): Promise<PaginatedResult<BookResponseDTO>> {
    const { items, total } = await this.books.list(toBookFilters(query), {
      page: query.page,
      limit: query.limit,
    });

    return new PaginatedResult(
      items.map((book) => BookResponseDTO.from(book)),
      total,
      query.page,
      query.limit,
    );
  }
}
