import { act, renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '@/services/httpClient';
import { booksService, type Book } from '../_services/booksService';
import { FILTER_DEBOUNCE_MS, useBooksList } from './useBooksList';

jest.mock('../_services/booksService', () => ({
  ...jest.requireActual('../_services/booksService'),
  booksService: { list: jest.fn() },
}));

const list = jest.mocked(booksService.list);

const book = (id: string): Book => ({
  id,
  title: `Libro ${id}`,
  price: 1000,
  isAvailable: true,
  imageUrl: null,
  author: { id: 'a', name: 'Autor' },
  publisher: { id: 'p', name: 'Editorial' },
  genre: { id: 'g', name: 'Género' },
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});

const page = (items: Book[], pageNumber = 1) => ({
  items,
  meta: { page: pageNumber, limit: 10, total: items.length, totalPages: 1 },
});

const lastParams = () => list.mock.calls.at(-1)![0];

describe('useBooksList', () => {
  beforeEach(() => {
    list.mockReset();
    list.mockResolvedValue(page([book('1')]));
  });

  it('carga la primera página al montar', async () => {
    const { result } = renderHook(() => useBooksList());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.books).toHaveLength(1);
    expect(result.current.meta).toMatchObject({ page: 1, total: 1 });
    expect(result.current.error).toBeNull();
    expect(lastParams()).toMatchObject({ page: 1, limit: 10 });
  });

  it('expone el error si la API falla', async () => {
    list.mockRejectedValue(new ApiError(500, 'caído'));

    const { result } = renderHook(() => useBooksList());

    await waitFor(() => expect(result.current.error).toBe('caído'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.books).toEqual([]);
  });

  it('un filtro vuelve a la página 1 y consulta de nuevo', async () => {
    const { result } = renderHook(() => useBooksList());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.goToPage(3));
    await waitFor(() => expect(lastParams()).toMatchObject({ page: 3 }));

    act(() => result.current.setFilter('genreIds', ['g1']));
    await waitFor(() =>
      expect(lastParams()).toMatchObject({ page: 1, genreIds: ['g1'] }),
    );
    expect(result.current.hasFilters).toBe(true);
  });

  it('muestra los libros anteriores mientras llega la respuesta nueva', async () => {
    const { result } = renderHook(() => useBooksList());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    list.mockReturnValue(new Promise(() => {}));
    act(() => result.current.setFilter('availability', 'true'));

    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(result.current.books).toHaveLength(1);
  });

  it('cancela la petición anterior al cambiar la consulta', async () => {
    const signals: AbortSignal[] = [];
    list.mockImplementation((_params, signal) => {
      signals.push(signal!);
      return new Promise(() => {});
    });
    const { result } = renderHook(() => useBooksList());

    act(() => result.current.setFilter('authorIds', ['a1']));

    await waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('setSort cambia el orden, vuelve a la página 1 y consulta al tiro', async () => {
    const { result } = renderHook(() => useBooksList());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.goToPage(2));
    await waitFor(() => expect(lastParams()).toMatchObject({ page: 2 }));

    act(() =>
      result.current.setSort([
        { field: 'title', direction: 'asc' },
        { field: 'price', direction: 'desc' },
      ]),
    );

    expect(result.current.query.page).toBe(1);
    await waitFor(() =>
      expect(lastParams()).toMatchObject({
        page: 1,
        sort: [
          { field: 'title', direction: 'asc' },
          { field: 'price', direction: 'desc' },
        ],
      }),
    );
  });

  it('limpiar filtros conserva el orden', async () => {
    const { result } = renderHook(() => useBooksList());
    act(() => result.current.setSort([{ field: 'title', direction: 'asc' }]));
    act(() => result.current.setFilter('genreIds', ['g1']));

    act(() => result.current.clearFilters());

    expect(result.current.query.genreIds).toEqual([]);
    expect(result.current.query.sort).toEqual([{ field: 'title', direction: 'asc' }]);
    expect(result.current.hasFilters).toBe(false);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('reload vuelve a pedir lo mismo', async () => {
    const { result } = renderHook(() => useBooksList());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const calls = list.mock.calls.length;

    act(() => result.current.reload());

    await waitFor(() => expect(list.mock.calls.length).toBe(calls + 1));
  });

  describe('debounce de búsqueda y filtros', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const flush = (ms = 0) =>
      act(async () => {
        jest.advanceTimersByTime(ms);
      });

    async function mount() {
      const hook = renderHook(() => useBooksList());
      await flush();
      list.mockClear();
      return hook;
    }

    it('la búsqueda espera antes de consultar y vuelve a la página 1', async () => {
      const { result } = await mount();
      act(() => result.current.goToPage(2));
      await flush();
      list.mockClear();

      act(() => result.current.setSearch('borges'));
      expect(result.current.query.search).toBe('borges');
      expect(result.current.query.page).toBe(1);

      await flush(FILTER_DEBOUNCE_MS - 1);
      expect(list).not.toHaveBeenCalled();

      await flush(1);
      expect(list).toHaveBeenCalledTimes(1);
      expect(lastParams()).toMatchObject({ search: 'borges', page: 1 });
      expect(result.current.exportParams.search).toBe('borges');
    });

    it('un filtro también espera, y nunca consulta "página 1 con los filtros viejos"', async () => {
      const { result } = await mount();
      act(() => result.current.goToPage(3));
      await flush();
      list.mockClear();

      act(() => result.current.setFilter('genreIds', ['g1']));
      expect(result.current.query.genreIds).toEqual(['g1']);
      await flush(FILTER_DEBOUNCE_MS - 1);
      expect(list).not.toHaveBeenCalled();

      await flush(1);
      expect(list).toHaveBeenCalledTimes(1);
      expect(lastParams()).toMatchObject({ page: 1, genreIds: ['g1'] });
    });

    it('varios cambios seguidos mandan una sola petición con todo', async () => {
      const { result } = await mount();

      act(() => result.current.setFilter('genreIds', ['g1']));
      await flush(100);
      act(() => result.current.setFilter('genreIds', ['g1', 'g2']));
      await flush(100);
      act(() => result.current.setFilter('authorIds', ['a1']));
      await flush(100);
      act(() => result.current.setFilter('availability', 'true'));
      expect(list).not.toHaveBeenCalled();

      await flush(FILTER_DEBOUNCE_MS);

      expect(list).toHaveBeenCalledTimes(1);
      expect(lastParams()).toMatchObject({
        genreIds: ['g1', 'g2'],
        authorIds: ['a1'],
        isAvailable: true,
      });
    });

    it('mientras se asientan los filtros la tabla figura como cargando', async () => {
      const { result } = await mount();
      expect(result.current.isLoading).toBe(false);

      act(() => result.current.setFilter('publisherIds', ['p1']));
      expect(result.current.isLoading).toBe(true);

      await flush(FILTER_DEBOUNCE_MS);
      expect(result.current.isLoading).toBe(false);
    });

    it('la página y el orden no esperan', async () => {
      const { result } = await mount();

      act(() => result.current.goToPage(2));
      await flush();
      expect(lastParams()).toMatchObject({ page: 2 });

      act(() => result.current.setSort([{ field: 'price', direction: 'asc' }]));
      await flush();
      expect(lastParams().sort).toEqual([{ field: 'price', direction: 'asc' }]);
    });

    it('el CSV usa los filtros ya aplicados, no los que aún se están marcando', async () => {
      const { result } = await mount();

      act(() => result.current.setFilter('genreIds', ['g1']));
      expect(result.current.exportParams.genreIds).toBeUndefined();

      await flush(FILTER_DEBOUNCE_MS);
      expect(result.current.exportParams.genreIds).toEqual(['g1']);
    });
  });
});
