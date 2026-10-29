import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { ApiError } from '@/services/httpClient';
import { catalogService } from '../_services/catalogService';
import { useCatalogs } from './useCatalogs';

jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
jest.mock('../_services/catalogService');

describe('useCatalogs', () => {
  beforeEach(() => jest.resetAllMocks());

  it('carga autores, editoriales y géneros', async () => {
    jest.mocked(catalogService.list).mockImplementation(async (kind) => [
      { id: kind, name: kind.toUpperCase() },
    ]);

    const { result } = renderHook(() => useCatalogs());

    expect(result.current).toMatchObject({ authors: [], publishers: [], genres: [] });
    await waitFor(() =>
      expect(result.current).toMatchObject({
        authors: [{ id: 'authors', name: 'AUTHORS' }],
        publishers: [{ id: 'publishers', name: 'PUBLISHERS' }],
        genres: [{ id: 'genres', name: 'GENRES' }],
      }),
    );
  });

  it('avisa si no se pueden cargar', async () => {
    jest.mocked(catalogService.list).mockRejectedValue(new ApiError(500, 'caído'));

    renderHook(() => useCatalogs());

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('caído'));
  });

  it('cancela las peticiones al desmontar y no avisa', async () => {
    let signal: AbortSignal | undefined;
    jest.mocked(catalogService.list).mockImplementation((_kind, s) => {
      signal = s;
      return new Promise((_, reject) => setTimeout(() => reject(new Error('abort')), 0));
    });

    const { unmount } = renderHook(() => useCatalogs());
    unmount();

    expect(signal?.aborted).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('addItem suma un elemento en su lugar alfabético, sin pedir nada a la API', async () => {
    jest.mocked(catalogService.list).mockImplementation(async (kind) =>
      kind === 'authors'
        ? [
            { id: 'a', name: 'Allende' },
            { id: 'c', name: 'Cortázar' },
          ]
        : [],
    );
    const { result } = renderHook(() => useCatalogs());
    await waitFor(() => expect(result.current.authors).toHaveLength(2));
    jest.mocked(catalogService.list).mockClear();

    act(() => result.current.addItem('authors', { id: 'b', name: 'Bolaño' }));

    expect(result.current.authors.map((author) => author.name)).toEqual([
      'Allende',
      'Bolaño',
      'Cortázar',
    ]);
    expect(result.current.genres).toEqual([]);
    expect(catalogService.list).not.toHaveBeenCalled();
  });
});
