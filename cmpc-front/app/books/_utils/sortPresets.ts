import type { BookSort } from '../_services/booksService';

export interface SortPreset {
  id: string;
  label: string;
  sort: BookSort[];
}

export const SORT_PRESETS: SortPreset[] = [
  { id: 'recent', label: 'Más recientes', sort: [] },
  { id: 'title-asc', label: 'Título: A → Z', sort: [{ field: 'title', direction: 'asc' }] },
  { id: 'title-desc', label: 'Título: Z → A', sort: [{ field: 'title', direction: 'desc' }] },
  {
    id: 'author-title',
    label: 'Autor y título',
    sort: [
      { field: 'author', direction: 'asc' },
      { field: 'title', direction: 'asc' },
    ],
  },
  {
    id: 'genre-price',
    label: 'Género y precio',
    sort: [
      { field: 'genre', direction: 'asc' },
      { field: 'price', direction: 'asc' },
    ],
  },
  { id: 'price-asc', label: 'Menor a mayor precio', sort: [{ field: 'price', direction: 'asc' }] },
  { id: 'price-desc', label: 'Mayor a menor precio', sort: [{ field: 'price', direction: 'desc' }] },
  {
    id: 'available-first',
    label: 'Disponibles primero',
    sort: [
      { field: 'isAvailable', direction: 'desc' },
      { field: 'title', direction: 'asc' },
    ],
  },
];

export function sortsEqual(a: BookSort[], b: BookSort[]): boolean {
  return (
    a.length === b.length &&
    a.every((item, i) => item.field === b[i].field && item.direction === b[i].direction)
  );
}

export function findPreset(sort: BookSort[]): SortPreset | null {
  return SORT_PRESETS.find((preset) => sortsEqual(preset.sort, sort)) ?? null;
}
