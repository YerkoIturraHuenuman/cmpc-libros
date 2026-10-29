import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { ApiError } from '@/services/httpClient';
import { booksService, type Book } from '../_services/booksService';
import { useBookForm } from './useBookForm';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('../_services/booksService');

const existing: Book = {
  id: 'b1',
  title: 'Rayuela',
  price: 12990.5,
  isAvailable: false,
  imageUrl: 'https://cdn/x.webp',
  author: { id: 'a1', name: 'Cortázar' },
  publisher: { id: 'p1', name: 'Alfaguara' },
  genre: { id: 'g1', name: 'Novela' },
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

function fill(result: { current: ReturnType<typeof useBookForm> }) {
  act(() => {
    result.current.form.setValue('title', 'Ficciones');
    result.current.form.setValue('price', '9990');
    result.current.form.setValue('authorId', 'a2');
    result.current.form.setValue('publisherId', 'p2');
    result.current.form.setValue('genreId', 'g2');
  });
}

describe('useBookForm', () => {
  beforeEach(() => jest.resetAllMocks());

  it('al crear parte vacío y disponible', () => {
    const { result } = renderHook(() => useBookForm(null, jest.fn()));

    expect(result.current.isEditing).toBe(false);
    expect(result.current.form.getValues()).toEqual({
      title: '',
      price: '',
      isAvailable: true,
      authorId: '',
      publisherId: '',
      genreId: '',
    });
  });

  it('al editar parte con los datos del libro', () => {
    const { result } = renderHook(() => useBookForm(existing, jest.fn()));

    expect(result.current.isEditing).toBe(true);
    expect(result.current.form.getValues()).toEqual({
      title: 'Rayuela',
      price: '12990.5',
      isAvailable: false,
      authorId: 'a1',
      publisherId: 'p1',
      genreId: 'g1',
    });
  });

  it('no llama a la API si el formulario es inválido', async () => {
    const onSaved = jest.fn();
    const { result } = renderHook(() => useBookForm(null, onSaved));

    await act(() => result.current.onSubmit());

    expect(booksService.create).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.form.formState.errors.title?.message).toBe(
      'El título es obligatorio',
    );
  });

  it('crea el libro y avisa', async () => {
    jest.mocked(booksService.create).mockResolvedValue(existing);
    const onSaved = jest.fn();
    const { result } = renderHook(() => useBookForm(null, onSaved));
    fill(result);

    await act(() => result.current.onSubmit());

    const body = jest.mocked(booksService.create).mock.calls[0][0];
    expect(body.get('title')).toBe('Ficciones');
    expect(body.get('price')).toBe('9990');
    expect(toast.success).toHaveBeenCalledWith('Libro creado');
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('si otra persona cambió el libro muestra el aviso del servidor y no cierra el formulario', async () => {
    jest
      .mocked(booksService.update)
      .mockRejectedValue(new ApiError(409, 'Otra persona modificó este libro mientras lo editabas.'));
    const onSaved = jest.fn();
    const { result } = renderHook(() => useBookForm(existing, onSaved));

    await act(() => result.current.onSubmit());

    expect(result.current.serverError).toBe('Otra persona modificó este libro mientras lo editabas.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('edita el libro y envía la portada nueva', async () => {
    jest.mocked(booksService.update).mockResolvedValue(existing);
    const onSaved = jest.fn();
    const { result } = renderHook(() => useBookForm(existing, onSaved));
    const image = new File(['x'], 'nueva.png', { type: 'image/png' });
    jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:p');
    act(() => result.current.image.select(image));

    await act(() => result.current.onSubmit());

    const [id, body] = jest.mocked(booksService.update).mock.calls[0];
    expect(id).toBe('b1');
    expect(body.get('image')).toBe(image);
    expect(body.get('expectedUpdatedAt')).toBe('2026-01-01');
    expect(toast.success).toHaveBeenCalledWith('Libro actualizado');
    expect(onSaved).toHaveBeenCalled();
  });

  it('pide quitar la portada actual al editar', async () => {
    jest.mocked(booksService.update).mockResolvedValue(existing);
    const { result } = renderHook(() => useBookForm(existing, jest.fn()));
    act(() => result.current.image.clear());

    await act(() => result.current.onSubmit());

    expect(jest.mocked(booksService.update).mock.calls[0][1].get('removeImage')).toBe('true');
  });

  it('muestra el error de la API y no cierra', async () => {
    jest
      .mocked(booksService.create)
      .mockRejectedValue(new ApiError(400, 'Ya existe un libro con ese título'));
    const onSaved = jest.fn();
    const { result } = renderHook(() => useBookForm(null, onSaved));
    fill(result);

    await act(() => result.current.onSubmit());

    expect(result.current.serverError).toBe('Ya existe un libro con ese título');
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });
});
