import {
  ALL,
  DEFAULT_QUERY,
  PAGE_SIZE,
  hasActiveFilters,
  toFiltersParams,
  toListParams,
} from './booksQuery';

describe('hasActiveFilters', () => {
  it('es false con la consulta por defecto', () => {
    expect(hasActiveFilters(DEFAULT_QUERY)).toBe(false);
  });

  it.each([
    { search: 'borges' },
    { genreIds: ['g1'] },
    { publisherIds: ['p1'] },
    { authorIds: ['a1'] },
    { availability: 'true' as const },
  ])('es true con %p', (change) => {
    expect(hasActiveFilters({ ...DEFAULT_QUERY, ...change })).toBe(true);
  });

  it('el orden y la página no cuentan como filtros', () => {
    expect(
      hasActiveFilters({ ...DEFAULT_QUERY, page: 3, sort: [{ field: 'title', direction: 'asc' }] }),
    ).toBe(false);
  });
});

describe('toFiltersParams / toListParams', () => {
  it('omite lo que está en "todos"', () => {
    expect(toFiltersParams(DEFAULT_QUERY)).toEqual({
      search: undefined,
      genreIds: undefined,
      publisherIds: undefined,
      authorIds: undefined,
      isAvailable: undefined,
      sort: [],
    });
  });

  it('convierte cada filtro al formato de la API', () => {
    const params = toFiltersParams({
      ...DEFAULT_QUERY,
      search: '  borges ',
      genreIds: ['g1', 'g2'],
      publisherIds: ['p1'],
      authorIds: ['a1'],
      availability: 'false',
    });

    expect(params).toMatchObject({
      search: 'borges',
      genreIds: ['g1', 'g2'],
      publisherIds: ['p1'],
      authorIds: ['a1'],
      isAvailable: false,
    });
  });

  it('availability "true" es true', () => {
    expect(toFiltersParams({ ...DEFAULT_QUERY, availability: 'true' }).isAvailable).toBe(true);
  });

  it('un search de solo espacios no se envía', () => {
    expect(toFiltersParams({ ...DEFAULT_QUERY, search: '   ' }).search).toBeUndefined();
  });

  it('el listado agrega página y tamaño', () => {
    expect(toListParams({ ...DEFAULT_QUERY, page: 4 })).toMatchObject({
      page: 4,
      limit: PAGE_SIZE,
    });
  });

  it('ALL es el valor de "sin filtro"', () => {
    expect(DEFAULT_QUERY.availability).toBe(ALL);
    expect(DEFAULT_QUERY.genreIds).toEqual([]);
  });
});
