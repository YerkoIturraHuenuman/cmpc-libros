import { bookSchema, parsePrice } from './bookSchema';

const valid = {
  title: 'Cien años de soledad',
  price: '12990',
  isAvailable: true,
  authorId: 'a1',
  publisherId: 'p1',
  genreId: 'g1',
};

const firstError = (data: unknown) => {
  const result = bookSchema.safeParse(data);
  return result.success ? null : result.error.issues[0].message;
};

describe('parsePrice', () => {
  it.each([
    ['12990', 12990],
    ['12990.5', 12990.5],
    ['12990,5', 12990.5],
    [' 100 ', 100],
  ])('convierte %p en %p', (input, expected) => {
    expect(parsePrice(input)).toBe(expected);
  });
});

describe('bookSchema', () => {
  it('acepta un libro válido', () => {
    expect(bookSchema.safeParse(valid).success).toBe(true);
  });

  it.each(['12990.50', '12990,5', '0'])('acepta el precio %p', (price) => {
    expect(bookSchema.safeParse({ ...valid, price }).success).toBe(true);
  });

  it('exige el título (sin contar espacios)', () => {
    expect(firstError({ ...valid, title: '   ' })).toBe('El título es obligatorio');
  });

  it('limita el título a 255 caracteres', () => {
    expect(firstError({ ...valid, title: 'a'.repeat(256) })).toBe('Máximo 255 caracteres');
  });

  it('exige el precio', () => {
    expect(firstError({ ...valid, price: '' })).toBe('Ingresa el precio');
  });

  it.each(['abc', '-5', '10.999', '1e3', '1,2,3'])('rechaza el precio %p', (price) => {
    expect(firstError({ ...valid, price })).toBe(
      'Usa un número positivo con hasta 2 decimales',
    );
  });

  it('rechaza un precio sobre el máximo', () => {
    expect(firstError({ ...valid, price: '100000000' })).toBe('El precio es demasiado alto');
  });

  it.each([
    ['authorId', 'Selecciona un autor'],
    ['publisherId', 'Selecciona una editorial'],
    ['genreId', 'Selecciona un género'],
  ])('exige %s', (field, message) => {
    expect(firstError({ ...valid, [field]: '' })).toBe(message);
  });
});
