import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { ApiError } from '@/services/httpClient';
import { catalogService } from '../_services/catalogService';
import { useCatalogItemForm } from './useCatalogItemForm';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../_services/catalogService');

describe('useCatalogItemForm', () => {
  beforeEach(() => jest.resetAllMocks());

  it('crea el elemento con el nombre recortado, avisa y notifica', async () => {
    const item = { id: 'g9', name: 'Terror' };
    jest.mocked(catalogService.create).mockResolvedValue(item);
    const onCreated = jest.fn();
    const { result } = renderHook(() => useCatalogItemForm('genres', onCreated));
    act(() => result.current.form.setValue('name', '  Terror '));

    await act(() => result.current.onSubmit());

    expect(catalogService.create).toHaveBeenCalledWith('genres', 'Terror');
    expect(toast.success).toHaveBeenCalledWith('Género creado');
    expect(onCreated).toHaveBeenCalledWith(item);
  });

  it('con el nombre vacío no llama a la API', async () => {
    const onCreated = jest.fn();
    const { result } = renderHook(() => useCatalogItemForm('authors', onCreated));

    await act(() => result.current.onSubmit());

    expect(catalogService.create).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
    expect(result.current.form.formState.errors.name?.message).toBe('Escribe un nombre');
  });

  it('muestra el error de la API y deja volver a intentar', async () => {
    jest.mocked(catalogService.create).mockRejectedValue(new ApiError(409, 'Ya existe'));
    const { result } = renderHook(() => useCatalogItemForm('publishers', jest.fn()));
    act(() => result.current.form.setValue('name', 'Planeta'));

    await act(() => result.current.onSubmit());

    expect(result.current.serverError).toBe('Ya existe');
    expect(result.current.isSubmitting).toBe(false);
  });
});
