import { act, renderHook } from '@testing-library/react';
import type { Book } from '../_services/booksService';
import { useBooksList } from './useBooksList';
import { useBooksPage } from './useBooksPage';

jest.mock('./useBooksList');
jest.mock('./useCatalogs', () => ({ useCatalogs: () => ({ authors: [], publishers: [], genres: [] }) }));
jest.mock('./useExportBooks', () => ({
  useExportBooks: () => ({ exportCsv: jest.fn(), isExporting: false }),
}));
jest.mock('@/app/(auth)/_hooks/useLogout', () => ({
  useLogout: () => ({ logout: jest.fn(), isLoggingOut: false }),
}));

const book = { id: 'b1', title: 'Rayuela' } as Book;

function setup(books: Book[], page = 1) {
  const goToPage = jest.fn();
  const reload = jest.fn();
  jest.mocked(useBooksList).mockReturnValue({
    books,
    query: { page },
    exportParams: {},
    goToPage,
    reload,
  } as unknown as ReturnType<typeof useBooksList>);
  return { ...renderHook(() => useBooksPage()), goToPage, reload };
}

describe('useBooksPage', () => {
  it('muestra los libros en cuadrícula y permite cambiar a lista y volver', () => {
    const { result } = setup([book]);
    expect(result.current.view).toBe('grid');

    act(() => result.current.setView('list'));
    expect(result.current.view).toBe('list');

    act(() => result.current.setView('grid'));
    expect(result.current.view).toBe('grid');
  });

  it('abre y cierra cada diálogo', () => {
    const { result } = setup([book]);
    expect(result.current.dialog).toBeNull();

    act(() => result.current.openCreate());
    expect(result.current.dialog).toEqual({ type: 'create' });

    act(() => result.current.openDetail(book));
    expect(result.current.dialog).toEqual({ type: 'detail', book });

    act(() => result.current.openSort());
    expect(result.current.dialog).toEqual({ type: 'sort' });

    act(() => result.current.openEdit(book));
    expect(result.current.dialog).toEqual({ type: 'edit', book });

    act(() => result.current.openDelete(book));
    expect(result.current.dialog).toEqual({ type: 'delete', book });

    act(() => result.current.closeDialog());
    expect(result.current.dialog).toBeNull();
  });

  it('al guardar cierra el diálogo y recarga', () => {
    const { result, reload } = setup([book]);
    act(() => result.current.openCreate());

    act(() => result.current.onSaved());

    expect(result.current.dialog).toBeNull();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('al eliminar recarga la página actual', () => {
    const { result, reload, goToPage } = setup([book, { ...book, id: 'b2' }], 2);

    act(() => result.current.onDeleted());

    expect(reload).toHaveBeenCalledTimes(1);
    expect(goToPage).not.toHaveBeenCalled();
  });

  it('si borra el único libro de la última página, retrocede una', () => {
    const { result, reload, goToPage } = setup([book], 3);

    act(() => result.current.onDeleted());

    expect(goToPage).toHaveBeenCalledWith(2);
    expect(reload).not.toHaveBeenCalled();
  });

  it('si borra el único libro de la primera página, solo recarga', () => {
    const { result, reload, goToPage } = setup([book], 1);

    act(() => result.current.onDeleted());

    expect(reload).toHaveBeenCalledTimes(1);
    expect(goToPage).not.toHaveBeenCalled();
  });
});
