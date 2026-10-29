import { CATALOG_LABELS } from './catalogLabels';

describe('CATALOG_LABELS', () => {
  it('cada catálogo apunta a su campo del formulario de libros', () => {
    expect(CATALOG_LABELS.authors.field).toBe('authorId');
    expect(CATALOG_LABELS.publishers.field).toBe('publisherId');
    expect(CATALOG_LABELS.genres.field).toBe('genreId');
  });

  it('tiene un nombre en singular para cada uno', () => {
    expect(Object.values(CATALOG_LABELS).map((label) => label.singular)).toEqual([
      'autor',
      'editorial',
      'género',
    ]);
  });
});
