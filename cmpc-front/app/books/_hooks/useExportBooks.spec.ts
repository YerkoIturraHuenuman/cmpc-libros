import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { ApiError } from '@/services/httpClient';
import { booksService } from '../_services/booksService';
import { downloadBlob } from '../_utils/downloadBlob';
import { useExportBooks } from './useExportBooks';

jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
jest.mock('../_services/booksService');
jest.mock('../_utils/downloadBlob');

describe('useExportBooks', () => {
  beforeEach(() => jest.resetAllMocks());

  it('descarga el CSV con los filtros recibidos', async () => {
    const blob = new Blob(['csv']);
    jest.mocked(booksService.exportCsv).mockResolvedValue(blob);
    const params = { search: 'x' };
    const { result } = renderHook(() => useExportBooks(params));

    await act(() => result.current.exportCsv());

    expect(booksService.exportCsv).toHaveBeenCalledWith(params);
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'libros.csv');
    expect(result.current.isExporting).toBe(false);
  });

  it('marca isExporting mientras descarga', async () => {
    let finish!: (blob: Blob) => void;
    jest.mocked(booksService.exportCsv).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = renderHook(() => useExportBooks({}));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.exportCsv();
    });
    expect(result.current.isExporting).toBe(true);

    await act(async () => {
      finish(new Blob());
      await pending;
    });
    expect(result.current.isExporting).toBe(false);
  });

  it('avisa si falla y no descarga nada', async () => {
    jest.mocked(booksService.exportCsv).mockRejectedValue(new ApiError(500, 'sin permiso'));
    const { result } = renderHook(() => useExportBooks({}));

    await act(() => result.current.exportCsv());

    expect(toast.error).toHaveBeenCalledWith('sin permiso');
    expect(downloadBlob).not.toHaveBeenCalled();
    expect(result.current.isExporting).toBe(false);
  });
});
