import { MAX_SORT_CRITERIA, SORT_FIELDS, nextFreeField } from './sortFields';

describe('nextFreeField', () => {
  it('sin criterios devuelve el primer campo', () => {
    expect(nextFreeField([])).toBe(SORT_FIELDS[0].field);
  });

  it('salta los campos que ya se usan', () => {
    expect(nextFreeField([{ field: 'title', direction: 'asc' }])).toBe('author');
    expect(
      nextFreeField([
        { field: 'title', direction: 'asc' },
        { field: 'author', direction: 'desc' },
      ]),
    ).toBe('publisher');
  });

  it('no deja pasar del máximo de criterios', () => {
    const full = SORT_FIELDS.slice(0, MAX_SORT_CRITERIA).map(({ field }) => ({
      field,
      direction: 'asc' as const,
    }));
    expect(nextFreeField(full)).toBeNull();
  });

  it('todos los campos tienen etiqueta y son distintos', () => {
    const fields = SORT_FIELDS.map(({ field }) => field);
    expect(new Set(fields).size).toBe(fields.length);
    expect(SORT_FIELDS.every(({ label }) => label.length > 0)).toBe(true);
  });
});
