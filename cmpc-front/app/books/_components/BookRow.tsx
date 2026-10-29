import { AvailabilityBadge } from './AvailabilityBadge';
import { BookActions } from './BookActions';
import { BookCover } from './BookCover';
import type { Book } from '../_services/booksService';
import { formatPrice } from '../_utils/format';

interface BookRowProps {
  book: Book;
  onView: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export function BookRow({ book, onView, onEdit, onDelete }: BookRowProps) {
  return (
    <article className="flex items-center gap-4 rounded-xl border bg-card p-3 transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => onView(book)}
        aria-label={`Ver ${book.title}`}
        className="shrink-0 overflow-hidden rounded-lg"
      >
        <BookCover
          src={book.imageUrl}
          title={book.title}
          sizes="96px"
          className="h-28 w-20 rounded-none"
        />
      </button>

      <div className="grid min-w-0 flex-1 gap-0.5">
        <button
          type="button"
          onClick={() => onView(book)}
          className="truncate text-left text-base font-semibold hover:underline"
          title={book.title}
        >
          {book.title}
        </button>
        <p className="truncate text-sm text-muted-foreground">{book.author.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {book.publisher.name} · {book.genre.name}
        </p>
      </div>

      <div className="hidden shrink-0 grid-cols-1 justify-items-end gap-1.5 sm:grid">
        <span className="text-lg font-semibold">{formatPrice(book.price)}</span>
        <AvailabilityBadge isAvailable={book.isAvailable} />
      </div>

      <BookActions title={book.title} onEdit={() => onEdit(book)} onDelete={() => onDelete(book)} />
    </article>
  );
}
