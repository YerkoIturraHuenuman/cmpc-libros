import { Book } from './Book';

export function makeBook(overrides: Partial<Book> = {}): Book {
  const base = new Book(
    'b-1',
    'Cien años de soledad',
    12990.5,
    true,
    null,
    { id: 'a-1', name: 'Gabriel García Márquez' },
    { id: 'p-1', name: 'Alfaguara' },
    { id: 'g-1', name: 'Novela' },
    new Date('2026-01-01T00:00:00Z'),
    new Date('2026-01-02T00:00:00Z'),
  );
  return Object.assign(base, overrides);
}
