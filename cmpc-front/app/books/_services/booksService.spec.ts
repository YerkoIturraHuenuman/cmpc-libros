import { request, requestBlob, requestPage } from '@/services/httpClient';
import { booksService, toQueryString } from './booksService';

jest.mock('@/services/httpClient');

describe('toQueryString', () => {
  it('queda vacío sin parámetros', () => {
    expect(toQueryString({})).toBe('');
  });

  it('serializa filtros, orden y paginación', () => {
    const query = toQueryString({
      search: 'borges',
      genreIds: ['g1', 'g2'],
      publisherIds: ['p1'],
      authorIds: ['a1'],
      isAvailable: false,
      sort: [
        { field: 'title', direction: 'asc' },
        { field: 'price', direction: 'desc' },
      ],
      page: 2,
      limit: 10,
    });
    const params = new URLSearchParams(query);

    expect(Object.fromEntries(params)).toEqual({
      search: 'borges',
      genreIds: 'g1,g2',
      publisherIds: 'p1',
      authorIds: 'a1',
      isAvailable: 'false',
      sort: 'title:asc,price:desc',
      page: '2',
      limit: '10',
    });
  });

  it('omite listas vacías y conserva isAvailable=true', () => {
    expect(toQueryString({ genreIds: [], sort: [], isAvailable: true })).toBe(
      'isAvailable=true',
    );
  });

  it('codifica los caracteres especiales', () => {
    expect(toQueryString({ search: 'ñandú & co' })).toBe('search=%C3%B1and%C3%BA+%26+co');
  });
});

describe('booksService', () => {
  beforeEach(() => jest.resetAllMocks());

  it('list pide la página con la señal de cancelación', async () => {
    const signal = new AbortController().signal;
    jest.mocked(requestPage).mockResolvedValue({ items: [], meta: {} as never });

    await booksService.list({ page: 1, limit: 10 }, signal);

    expect(requestPage).toHaveBeenCalledWith('/books?page=1&limit=10', { signal });
  });

  it('get, create, update y remove usan el método y la ruta correctos', async () => {
    const body = new FormData();
    jest.mocked(request).mockResolvedValue(undefined);

    await booksService.get('b1');
    await booksService.create(body);
    await booksService.update('b1', body);
    await booksService.remove('b1');

    expect(jest.mocked(request).mock.calls).toEqual([
      ['/books/b1'],
      ['/books', { method: 'POST', body }],
      ['/books/b1', { method: 'PATCH', body }],
      ['/books/b1', { method: 'DELETE' }],
    ]);
  });

  it('exportCsv pide el archivo con los filtros', async () => {
    jest.mocked(requestBlob).mockResolvedValue(new Blob());

    await booksService.exportCsv({ search: 'x', sort: [{ field: 'title', direction: 'asc' }] });

    expect(requestBlob).toHaveBeenCalledWith('/books/export?search=x&sort=title%3Aasc');
  });
});
