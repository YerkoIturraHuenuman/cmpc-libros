import { MAX_IMAGE_BYTES, validateImage } from './bookImage';

const file = (type: string, size = 100) =>
  new File([new Uint8Array(size)], 'portada', { type });

describe('validateImage', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('acepta %s', (type) => {
    expect(validateImage(file(type))).toBeNull();
  });

  it.each(['image/svg+xml', 'image/gif', 'application/pdf', ''])(
    'rechaza el tipo %p',
    (type) => {
      expect(validateImage(file(type))).toBe('La portada debe ser JPEG, PNG o WebP');
    },
  );

  it('acepta justo el máximo y rechaza un byte más', () => {
    expect(validateImage(file('image/png', MAX_IMAGE_BYTES))).toBeNull();
    expect(validateImage(file('image/png', MAX_IMAGE_BYTES + 1))).toBe(
      'La portada no puede superar los 5 MB',
    );
  });
});
