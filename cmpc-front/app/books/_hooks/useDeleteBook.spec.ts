import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { ApiError } from '@/services/httpClient';
import { booksService, type Book } from '../_services/booksService';
import { useDeleteBook } from './useDeleteBook';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../_services/booksService');

const book = { id: 'b1', title: 'Rayuela' } as Book;

describe('useDeleteBook', () => {
  beforeEach(() => jest.resetAllMocks());

  it('elimina, avisa y notifica', async () => {
    jest.mocked(booksService.remove).mockResolvedValue(undefined);
    const onDeleted = jest.fn();
    const { result } = renderHook(() => useDeleteBook(book, onDeleted));

    await act(() => result.current.confirmDelete());

    expect(booksService.remove).toHaveBeenCalledWith('b1');
    expect(toast.success).toHaveBeenCalledWith('«Rayuela» eliminado');
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('si falla avisa y deja volver a intentar', async () => {
    jest.mocked(booksService.remove).mockRejectedValue(new ApiError(404, 'no existe'));
    const onDeleted = jest.fn();
    const { result } = renderHook(() => useDeleteBook(book, onDeleted));

    await act(() => result.current.confirmDelete());

    expect(toast.error).toHaveBeenCalledWith('no existe');
    expect(onDeleted).not.toHaveBeenCalled();
    expect(result.current.isDeleting).toBe(false);
  });
});
