import { BookOpen, Download, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FilterKey } from '../_hooks/useBooksList';
import type { CatalogItem } from '../_services/catalogService';
import type { BooksQuery } from '../_utils/booksQuery';
import { BooksFilters } from './BooksFilters';

interface BooksSidebarProps {
  query: BooksQuery;
  authors: CatalogItem[];
  publishers: CatalogItem[];
  genres: CatalogItem[];
  hasFilters: boolean;
  onSearch: (value: string) => void;
  onFilter: <K extends FilterKey>(key: K, value: BooksQuery[K]) => void;
  onClear: () => void;
  onExport: () => void;
  isExporting: boolean;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function BooksSidebar({
  query,
  authors,
  publishers,
  genres,
  hasFilters,
  onSearch,
  onFilter,
  onClear,
  onExport,
  isExporting,
  onLogout,
  isLoggingOut,
}: BooksSidebarProps) {
  return (
    <aside className="flex flex-col gap-7 border-b bg-card p-5 lg:sticky lg:top-0 lg:h-svh lg:overflow-y-auto lg:border-r lg:border-b-0">
      <div className="flex items-center gap-3 text-lg font-semibold">
        <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <BookOpen className="size-5" aria-hidden />
        </span>
        CMPC Libros
      </div>

      <BooksFilters
        query={query}
        authors={authors}
        publishers={publishers}
        genres={genres}
        hasFilters={hasFilters}
        onSearch={onSearch}
        onFilter={onFilter}
        onClear={onClear}
      />

      <div className="mt-auto grid gap-2 border-t pt-5">
        <Button variant="outline" onClick={onExport} disabled={isExporting}>
          <Download /> {isExporting ? 'Exportando…' : 'Exportar CSV'}
        </Button>
        <Button variant="ghost" onClick={onLogout} disabled={isLoggingOut}>
          <LogOut /> Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}
