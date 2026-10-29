import { Injectable } from '@nestjs/common';
import type { Book } from '../../domain/entities/Book';
import type { CsvExporterPort } from '../../domain/ports/CsvExporterPort';

const HEADERS = [
  'ID',
  'Título',
  'Autor',
  'Editorial',
  'Género',
  'Precio',
  'Disponible',
  'Creado',
];

const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const BOM = '﻿';

@Injectable()
export class CsvExporterService implements CsvExporterPort {
  export(books: Book[]): string {
    const rows = books.map((book) => [
      book.id,
      book.title,
      book.author.name,
      book.publisher.name,
      book.genre.name,
      book.price.toFixed(2),
      book.isAvailable ? 'Sí' : 'No',
      book.createdAt.toISOString(),
    ]);

    const lines = [HEADERS, ...rows].map((row) =>
      row.map((cell) => this.escape(cell)).join(','),
    );

    return BOM + lines.join('\r\n') + '\r\n';
  }

  escape(value: string): string {
    const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  }
}
