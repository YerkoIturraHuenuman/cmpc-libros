import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOOK_REPOSITORY } from '@/common/config/di-tokens';
import type { BookRepositoryPort } from '../../domain/ports/BookRepositoryPort';
import { BookResponseDTO } from '../dto/BookResponseDTO';

@Injectable()
export class GetBookById {
  constructor(
    @Inject(BOOK_REPOSITORY) private readonly books: BookRepositoryPort,
  ) {}

  async execute(id: string): Promise<BookResponseDTO> {
    const book = await this.books.findById(id);
    if (!book) {
      throw new NotFoundException('Libro no encontrado');
    }
    return BookResponseDTO.from(book);
  }
}
