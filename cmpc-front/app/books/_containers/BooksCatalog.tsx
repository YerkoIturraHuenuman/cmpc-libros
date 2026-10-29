import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookCard } from '../_components/BookCard';
import { BookRow } from '../_components/BookRow';
import type { Book } from '../_services/booksService';
import type { BooksView } from '../_utils/booksView';

interface BooksCatalogProps {
  books: Book[];
  view: BooksView;
  isLoading: boolean;
  error: string | null;
  onView: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onRetry: () => void;
}

const SKELETON_COUNT = 8;

const GRID = 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4';
const LIST = 'grid gap-3';

export function BooksCatalog({
  books,
  view,
  isLoading,
  error,
  onView,
  onEdit,
  onDelete,
  onRetry,
}: BooksCatalogProps) {
  const isFirstLoad = isLoading && books.length === 0;
  const layout = view === 'grid' ? GRID : LIST;

  if (isFirstLoad) {
    return (
      <div className={layout} data-view={view} aria-busy="true">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <div key={index} data-skeleton-item className="overflow-hidden rounded-xl border bg-card">
            {view === 'grid' ? (
              <>
                <Skeleton className="aspect-3/4 w-full rounded-none" />
                <div className="grid gap-2 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              </>
            ) : (
              <Skeleton className="h-28 w-full rounded-none" />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid justify-items-center gap-3 rounded-xl border bg-card py-14 text-center">
        <p role="alert" className="text-destructive">
          {error}
        </p>
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!isLoading && books.length === 0) {
    return (
      <p className="rounded-xl border bg-card py-14 text-center text-muted-foreground">
        No hay libros que coincidan.
      </p>
    );
  }

  const Item = view === 'grid' ? BookCard : BookRow;

  return (
    <div
      className={`${layout} transition-opacity ${isLoading ? 'opacity-60' : ''}`}
      data-view={view}
      aria-busy={isLoading}
    >
      {books.map((book) => (
        <Item key={book.id} book={book} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
