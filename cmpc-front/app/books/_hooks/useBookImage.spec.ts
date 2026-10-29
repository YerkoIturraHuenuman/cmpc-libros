import { act, renderHook } from '@testing-library/react';
import { useBookImage } from './useBookImage';

const png = new File(['x'], 'portada.png', { type: 'image/png' });
const svg = new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' });

describe('useBookImage', () => {
  let create: jest.SpyInstance;
  let revoke: jest.SpyInstance;

  beforeEach(() => {
    create = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    revoke = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('sin cambios muestra la portada actual', () => {
    const { result } = renderHook(() => useBookImage('https://cdn/x.webp'));

    expect(result.current.shownUrl).toBe('https://cdn/x.webp');
    expect(result.current.file).toBeNull();
    expect(result.current.removed).toBe(false);
  });

  it('un archivo válido pasa a ser la vista previa', () => {
    const { result } = renderHook(() => useBookImage('https://cdn/x.webp'));

    act(() => result.current.select(png));

    expect(result.current.file).toBe(png);
    expect(result.current.shownUrl).toBe('blob:preview');
    expect(result.current.error).toBeNull();
  });

  it('rechaza un archivo inválido y conserva lo anterior', () => {
    const { result } = renderHook(() => useBookImage(null));

    act(() => result.current.select(svg));

    expect(result.current.error).toBe('La portada debe ser JPEG, PNG o WebP');
    expect(result.current.file).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it('ignora una selección vacía', () => {
    const { result } = renderHook(() => useBookImage(null));

    act(() => result.current.select(undefined));

    expect(result.current.error).toBeNull();
    expect(result.current.file).toBeNull();
  });

  it('quitar con portada actual la marca para eliminar, y restore la conserva', () => {
    const { result } = renderHook(() => useBookImage('https://cdn/x.webp'));

    act(() => result.current.clear());
    expect(result.current.removed).toBe(true);
    expect(result.current.shownUrl).toBeNull();

    act(() => result.current.restore());
    expect(result.current.removed).toBe(false);
    expect(result.current.shownUrl).toBe('https://cdn/x.webp');
  });

  it('quitar sin portada actual no marca nada para eliminar', () => {
    const { result } = renderHook(() => useBookImage(null));

    act(() => result.current.select(png));
    act(() => result.current.clear());

    expect(result.current.removed).toBe(false);
    expect(result.current.file).toBeNull();
    expect(result.current.shownUrl).toBeNull();
  });

  it('elegir un archivo después de quitar anula el quitar', () => {
    const { result } = renderHook(() => useBookImage('https://cdn/x.webp'));

    act(() => result.current.clear());
    act(() => result.current.select(png));

    expect(result.current.removed).toBe(false);
  });

  it('libera la vista previa al reemplazarla y al desmontar', () => {
    create.mockReturnValueOnce('blob:uno').mockReturnValueOnce('blob:dos');
    const { result, unmount } = renderHook(() => useBookImage(null));

    act(() => result.current.select(png));
    act(() => result.current.select(png));
    expect(revoke).toHaveBeenCalledWith('blob:uno');

    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:dos');
  });
});
