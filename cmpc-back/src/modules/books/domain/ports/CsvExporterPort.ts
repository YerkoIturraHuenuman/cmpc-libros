import type { Book } from '../entities/Book';

export interface CsvExporterPort {
  export(books: Book[]): string;
}
