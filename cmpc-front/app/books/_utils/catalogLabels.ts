import type { CatalogKind } from '../_services/catalogService';
import type { BookFormValues } from './bookSchema';

interface CatalogLabel {
  singular: string;
  field: keyof Pick<BookFormValues, 'authorId' | 'publisherId' | 'genreId'>;
  placeholder: string;
}

export const CATALOG_LABELS: Record<CatalogKind, CatalogLabel> = {
  authors: { singular: 'autor', field: 'authorId', placeholder: 'Gabriel García Márquez' },
  publishers: { singular: 'editorial', field: 'publisherId', placeholder: 'Penguin Random House' },
  genres: { singular: 'género', field: 'genreId', placeholder: 'Ciencia ficción' },
};
