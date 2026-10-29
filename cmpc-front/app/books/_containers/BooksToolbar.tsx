import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SortMenu } from '../_components/SortMenu';
import { ViewToggle } from '../_components/ViewToggle';
import type { BookSort } from '../_services/booksService';
import type { BooksView } from '../_utils/booksView';

interface BooksToolbarProps {
  total: number | null;
  sort: BookSort[];
  onSortChange: (sort: BookSort[]) => void;
  onCustomSort: () => void;
  view: BooksView;
  onViewChange: (view: BooksView) => void;
  onCreate: () => void;
}

export function BooksToolbar({
  total,
  sort,
  onSortChange,
  onCustomSort,
  view,
  onViewChange,
  onCreate,
}: BooksToolbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Libros</h1>
        <p className="text-sm text-muted-foreground">
          {total === null ? 'Cargando…' : `${total} ${total === 1 ? 'libro' : 'libros'}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SortMenu sort={sort} onChange={onSortChange} onCustom={onCustomSort} />
        <ViewToggle view={view} onChange={onViewChange} />
        <Button onClick={onCreate}>
          <Plus /> Nuevo libro
        </Button>
      </div>
    </header>
  );
}
