import { makeBook } from '../../domain/entities/Book.fixture';
import { CsvExporterService } from './CsvExporterService';

describe('CsvExporterService', () => {
  const exporter = new CsvExporterService();

  it('empieza con BOM (Excel) y la fila de encabezados', () => {
    const csv = exporter.export([]);

    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toBe(
      '﻿ID,Título,Autor,Editorial,Género,Precio,Disponible,Creado\r\n',
    );
  });

  it('escribe una fila por libro con precio de 2 decimales y Sí/No', () => {
    const csv = exporter.export([
      makeBook({ price: 5000 }),
      makeBook({ id: 'b-2', isAvailable: false }),
    ]);
    const lines = csv.split('\r\n');

    expect(lines[1]).toBe(
      'b-1,Cien años de soledad,Gabriel García Márquez,Alfaguara,Novela,5000.00,Sí,2026-01-01T00:00:00.000Z',
    );
    expect(lines[2]).toContain(',12990.50,No,');
  });

  it('entrecomilla comas, comillas y saltos de línea', () => {
    expect(exporter.escape('Hola, mundo')).toBe('"Hola, mundo"');
    expect(exporter.escape('Dijo "hola"')).toBe('"Dijo ""hola"""');
    expect(exporter.escape('línea1\nlínea2')).toBe('"línea1\nlínea2"');
    expect(exporter.escape('normal')).toBe('normal');
  });

  it.each(['=SUM(A1:A9)', '+cmd', '-1+2', '@usuario', '\tcmd'])(
    'neutraliza la inyección de fórmulas en "%s"',
    (value) => {
      expect(exporter.escape(value).replace(/^"/, '').startsWith("'")).toBe(true);
    },
  );

  it('un título malicioso no sale como fórmula en el archivo', () => {
    const csv = exporter.export([makeBook({ title: '=HYPERLINK("http://malo")' })]);
    expect(csv).toContain(`"'=HYPERLINK(""http://malo"")"`);
  });
});
