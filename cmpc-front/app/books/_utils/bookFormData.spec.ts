import { toBookFormData } from './bookFormData';

const values = {
  title: '  Rayuela  ',
  price: '12990,5',
  isAvailable: false,
  authorId: 'a1',
  publisherId: 'p1',
  genreId: 'g1',
};

describe('toBookFormData', () => {
  it('normaliza los campos', () => {
    const data = toBookFormData(values, { file: null, removeImage: false });

    expect(Object.fromEntries(data.entries())).toEqual({
      title: 'Rayuela',
      price: '12990.5',
      isAvailable: 'false',
      authorId: 'a1',
      publisherId: 'p1',
      genreId: 'g1',
    });
  });

  it('adjunta la versión del libro al editar', () => {
    const data = toBookFormData(values, {
      file: null,
      removeImage: false,
      expectedUpdatedAt: '2026-01-02T10:00:00.000Z',
    });

    expect(data.get('expectedUpdatedAt')).toBe('2026-01-02T10:00:00.000Z');
  });

  it('adjunta la portada nueva', () => {
    const image = new File(['x'], 'portada.png', { type: 'image/png' });

    const data = toBookFormData(values, { file: image, removeImage: false });

    expect(data.get('image')).toBe(image);
    expect(data.has('removeImage')).toBe(false);
  });

  it('pide quitar la portada actual', () => {
    const data = toBookFormData(values, { file: null, removeImage: true });

    expect(data.get('removeImage')).toBe('true');
    expect(data.has('image')).toBe(false);
  });

  it('si hay portada nueva ignora quitar la actual', () => {
    const image = new File(['x'], 'portada.png', { type: 'image/png' });

    const data = toBookFormData(values, { file: image, removeImage: true });

    expect(data.get('image')).toBe(image);
    expect(data.has('removeImage')).toBe(false);
  });
});
