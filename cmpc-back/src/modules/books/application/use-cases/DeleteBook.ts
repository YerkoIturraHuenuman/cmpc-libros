import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BOOK_REPOSITORY } from '@/common/config/di-tokens';
import { FlowLogger } from '@/common/logging/FlowLogger';
import type { BookRepositoryPort } from '../../domain/ports/BookRepositoryPort';

@Injectable()
export class DeleteBook {
  private readonly flow = new FlowLogger(DeleteBook.name);

  constructor(
    @Inject(BOOK_REPOSITORY) private readonly books: BookRepositoryPort,
  ) {}

  execute(id: string): Promise<void> {
    return this.flow.track('execute', { id }, async () => {
      const deleted = await this.books.softDelete(id);
      if (!deleted) {
        throw new NotFoundException('Libro no encontrado');
      }
    });
  }
}
