import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MultiSelectFilter } from '../_components/MultiSelectFilter';
import { OptionSelect } from '../_components/OptionSelect';
import type { FilterKey } from '../_hooks/useBooksList';
import type { CatalogItem } from '../_services/catalogService';
import type { Availability, BooksQuery } from '../_utils/booksQuery';

interface BooksFiltersProps {
  query: BooksQuery;
  authors: CatalogItem[];
  publishers: CatalogItem[];
  genres: CatalogItem[];
  hasFilters: boolean;
  onSearch: (value: string) => void;
  onFilter: <K extends FilterKey>(key: K, value: BooksQuery[K]) => void;
  onClear: () => void;
}

const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: 'true', label: 'Disponibles' },
  { value: 'false', label: 'No disponibles' },
];

const toOptions = (items: CatalogItem[]) =>
  items.map((item) => ({ value: item.id, label: item.name }));

function FilterBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function BooksFilters({
  query,
  authors,
  publishers,
  genres,
  hasFilters,
  onSearch,
  onFilter,
  onClear,
}: BooksFiltersProps) {
  return (
    <section aria-label="Filtros" className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase">Filtros</h2>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Limpiar
          </Button>
        )}
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query.search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Buscar título o autor"
          aria-label="Buscar libros"
          className="pl-11"
        />
      </div>

      <FilterBlock label="Género">
        <MultiSelectFilter
          label="géneros"
          allLabel="Todos los géneros"
          options={toOptions(genres)}
          selected={query.genreIds}
          onChange={(ids) => onFilter('genreIds', ids)}
        />
      </FilterBlock>
      <FilterBlock label="Editorial">
        <MultiSelectFilter
          label="editoriales"
          allLabel="Todas las editoriales"
          options={toOptions(publishers)}
          selected={query.publisherIds}
          onChange={(ids) => onFilter('publisherIds', ids)}
        />
      </FilterBlock>
      <FilterBlock label="Autor">
        <MultiSelectFilter
          label="autores"
          allLabel="Todos los autores"
          options={toOptions(authors)}
          selected={query.authorIds}
          onChange={(ids) => onFilter('authorIds', ids)}
        />
      </FilterBlock>
      <FilterBlock label="Disponibilidad">
        <OptionSelect
          value={query.availability}
          onValueChange={(value) => onFilter('availability', value as Availability)}
          options={AVAILABILITY_OPTIONS}
          placeholder="Disponibilidad"
          allLabel="Toda disponibilidad"
        />
      </FilterBlock>
    </section>
  );
}
