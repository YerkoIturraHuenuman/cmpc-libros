import { parseSort, toBookFilters } from './toBookFilters';

describe('parseSort', () => {
  it('ordena por fecha de creación descendente si no se pide nada', () => {
    expect(parseSort()).toEqual([{ field: 'createdAt', direction: 'desc' }]);
    expect(parseSort('')).toEqual([{ field: 'createdAt', direction: 'desc' }]);
  });

  it('respeta el orden y la dirección de cada campo', () => {
    expect(parseSort('title:asc,price:desc,author:asc')).toEqual([
      { field: 'title', direction: 'asc' },
      { field: 'price', direction: 'desc' },
      { field: 'author', direction: 'asc' },
    ]);
  });

  it('ignora campos repetidos y se queda con el primero', () => {
    expect(parseSort('title:asc,title:desc')).toEqual([
      { field: 'title', direction: 'asc' },
    ]);
  });
});

describe('toBookFilters', () => {
  it('traduce el query a filtros del dominio', () => {
    const filters = toBookFilters({
      search: 'rayuela',
      genreIds: ['g1'],
      publisherIds: ['p1'],
      authorIds: ['a1'],
      isAvailable: false,
      sort: 'price:asc',
    });

    expect(filters).toEqual({
      search: 'rayuela',
      genreIds: ['g1'],
      publisherIds: ['p1'],
      authorIds: ['a1'],
      isAvailable: false,
      sort: [{ field: 'price', direction: 'asc' }],
    });
  });

  it('descarta la búsqueda vacía y usa el orden por defecto', () => {
    const filters = toBookFilters({ search: '' });
    expect(filters.search).toBeUndefined();
    expect(filters.sort).toEqual([{ field: 'createdAt', direction: 'desc' }]);
  });
});
