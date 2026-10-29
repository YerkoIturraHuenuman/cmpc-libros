import type { Book } from '../_services/booksService';

export function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'b1',
    title: 'Rayuela',
    price: 12990,
    isAvailable: true,
    imageUrl: null,
    author: { id: 'a1', name: 'Julio Cortázar' },
    publisher: { id: 'p1', name: 'Alfaguara' },
    genre: { id: 'g1', name: 'Novela' },
    createdAt: '2026-10-28T12:00:00.000Z',
    updatedAt: '2026-10-28T13:00:00.000Z',
    ...overrides,
  };
}
