import { Book, MAX_PRICE } from './Book';

describe('Book.validate', () => {
  it('no reporta nada si los datos son válidos', () => {
    expect(Book.validate({ title: 'Rayuela', price: 0 })).toEqual([]);
    expect(Book.validate({})).toEqual([]);
  });

  it('rechaza un título vacío o solo espacios', () => {
    expect(Book.validate({ title: '   ' })).toContain('El título no puede estar vacío');
  });

  it('rechaza precios negativos o no numéricos', () => {
    expect(Book.validate({ price: -1 })).toContain('El precio no puede ser negativo');
    expect(Book.validate({ price: Number.NaN })).toHaveLength(1);
    expect(Book.validate({ price: Infinity })).toHaveLength(1);
  });

  it('rechaza precios por sobre el máximo que soporta la columna', () => {
    expect(Book.validate({ price: MAX_PRICE })).toEqual([]);
    expect(Book.validate({ price: MAX_PRICE + 1 })[0]).toContain('no puede superar');
  });

  it('acumula varias violaciones', () => {
    expect(Book.validate({ title: '', price: -5 })).toHaveLength(2);
  });
});
