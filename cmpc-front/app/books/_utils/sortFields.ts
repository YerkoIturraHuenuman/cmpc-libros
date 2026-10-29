import type { BookSort, SortField } from '../_services/booksService';

export const SORT_FIELDS: { field: SortField; label: string }[] = [
  { field: 'title', label: 'Título' },
  { field: 'author', label: 'Autor' },
  { field: 'publisher', label: 'Editorial' },
  { field: 'genre', label: 'Género' },
  { field: 'price', label: 'Precio' },
  { field: 'isAvailable', label: 'Disponibilidad' },
  { field: 'createdAt', label: 'Fecha de alta' },
];

export const MAX_SORT_CRITERIA = 3;

export function nextFreeField(sort: BookSort[]): SortField | null {
  if (sort.length >= MAX_SORT_CRITERIA) return null;
  const used = new Set(sort.map((item) => item.field));
  return SORT_FIELDS.find(({ field }) => !used.has(field))!.field;
}
