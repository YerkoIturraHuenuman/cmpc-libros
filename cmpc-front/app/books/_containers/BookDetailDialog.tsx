import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AvailabilityBadge } from '../_components/AvailabilityBadge';
import { BookCover } from '../_components/BookCover';
import type { Book } from '../_services/booksService';
import { formatDate, formatPrice } from '../_utils/format';

interface BookDetailDialogProps {
  book: Book | null;
  onClose: () => void;
}

export function BookDetailDialog({ book, onClose }: BookDetailDialogProps) {
  return (
    <Dialog open={book !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {book && (
          <>
            <DialogHeader>
              <DialogTitle>{book.title}</DialogTitle>
              <DialogDescription>{book.author.name}</DialogDescription>
            </DialogHeader>
            <div className="flex gap-4">
              <BookCover src={book.imageUrl} title={book.title} className="h-56 w-40" />
              <dl className="grid flex-1 content-start gap-3">
                <Detail label="Precio">{formatPrice(book.price)}</Detail>
                <Detail label="Editorial">{book.publisher.name}</Detail>
                <Detail label="Género">{book.genre.name}</Detail>
                <Detail label="Estado">
                  <AvailabilityBadge isAvailable={book.isAvailable} />
                </Detail>
                <Detail label="Creado">{formatDate(book.createdAt)}</Detail>
                <Detail label="Actualizado">{formatDate(book.updatedAt)}</Detail>
              </dl>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
