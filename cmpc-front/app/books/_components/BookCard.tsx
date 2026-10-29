import { AvailabilityBadge } from './AvailabilityBadge';
import { BookActions } from './BookActions';
import { BookCover } from './BookCover';
import type { Book } from '../_services/booksService';
import { formatPrice } from '../_utils/format';

interface BookCardProps {
  book: Book;
  onView: (book: Book) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}

export function BookCard({ book, onView, onEdit, onDelete }: BookCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => onView(book)}
        aria-label={`Ver ${book.title}`}
        className="block overflow-hidden bg-muted"
      >
        <BookCover
          src={book.imageUrl}
          title={book.title}
          sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="aspect-3/4 w-full rounded-none transition-transform duration-300 group-hover:scale-105"
        />
      </button>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <button
          type="button"
          onClick={() => onView(book)}
          className="line-clamp-2 text-left text-base leading-snug font-semibold hover:underline"
          title={book.title}
        >
          {book.title}
        </button>
        <p className="truncate text-sm text-muted-foreground">{book.author.name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {book.publisher.name} · {book.genre.name}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="grid gap-1.5">
            <span className="text-xl leading-none font-semibold">{formatPrice(book.price)}</span>
            <AvailabilityBadge isAvailable={book.isAvailable} />
          </div>
          <BookActions
            title={book.title}
            onEdit={() => onEdit(book)}
            onDelete={() => onDelete(book)}
          />
        </div>
      </div>
    </article>
  );
}
