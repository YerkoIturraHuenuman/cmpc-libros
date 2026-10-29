import type { BookSort } from '../_services/booksService';
import { SORT_PRESETS, findPreset, sortsEqual } from './sortPresets';

describe('SORT_PRESETS', () => {
  it('tiene ids y etiquetas únicos', () => {
    expect(new Set(SORT_PRESETS.map((p) => p.id)).size).toBe(SORT_PRESETS.length);
    expect(new Set(SORT_PRESETS.map((p) => p.label)).size).toBe(SORT_PRESETS.length);
  });

  it('el primero es el orden por defecto (sin criterios)', () => {
    expect(SORT_PRESETS[0].sort).toEqual([]);
  });

  it('ningún preset usa un campo repetido ni más de tres criterios', () => {
    for (const preset of SORT_PRESETS) {
      const fields = preset.sort.map((item) => item.field);
      expect(new Set(fields).size).toBe(fields.length);
      expect(fields.length).toBeLessThanOrEqual(3);
    }
  });

  it('incluye órdenes que combinan varios campos', () => {
    expect(SORT_PRESETS.some((p) => p.sort.length > 1)).toBe(true);
  });
});

describe('sortsEqual', () => {
  const title: BookSort = { field: 'title', direction: 'asc' };

  it('compara campo y dirección en orden', () => {
    expect(sortsEqual([title], [{ ...title }])).toBe(true);
    expect(sortsEqual([title], [{ field: 'title', direction: 'desc' }])).toBe(false);
    expect(sortsEqual([title], [{ field: 'price', direction: 'asc' }])).toBe(false);
    expect(sortsEqual([title], [])).toBe(false);
    expect(sortsEqual([], [])).toBe(true);
  });

  it('el orden de los criterios importa', () => {
    const price: BookSort = { field: 'price', direction: 'asc' };
    expect(sortsEqual([title, price], [price, title])).toBe(false);
  });
});

describe('findPreset', () => {
  it.each(SORT_PRESETS)('reconoce el preset «$label»', (preset) => {
    expect(findPreset(preset.sort)).toBe(preset);
  });

  it('devuelve null para un orden que no es un preset', () => {
    expect(findPreset([{ field: 'publisher', direction: 'desc' }])).toBeNull();
  });
});
