import { Inject, Injectable } from '@nestjs/common';
import { BOOK_REPOSITORY, CSV_EXPORTER } from '@/common/config/di-tokens';
import { FlowLogger } from '@/common/logging/FlowLogger';
import type { BookRepositoryPort } from '../../domain/ports/BookRepositoryPort';
import type { CsvExporterPort } from '../../domain/ports/CsvExporterPort';
import type { ExportBooksQueryDTO } from '../dto/ListBooksQueryDTO';
import { toBookFilters } from '../dto/toBookFilters';

@Injectable()
export class ExportBooksCsv {
  private readonly flow = new FlowLogger(ExportBooksCsv.name);

  constructor(
    @Inject(BOOK_REPOSITORY) private readonly books: BookRepositoryPort,
    @Inject(CSV_EXPORTER) private readonly csv: CsvExporterPort,
  ) {}

  execute(query: ExportBooksQueryDTO): Promise<string> {
    const filters = toBookFilters(query);
    return this.flow.track(
      'execute',
      { ...filters },
      async () => {
        const books = await this.books.findAll(filters);
        return this.csv.export(books);
      },
      (csv) => ({ bytes: Buffer.byteLength(csv) }),
    );
  }
}
