'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { Book } from '../_services/booksService';
import type { CatalogItem, CatalogKind } from '../_services/catalogService';
import { BookFormPanel } from './BookFormPanel';

interface BookFormDialogProps {
  open: boolean;
  book: Book | null;
  authors: CatalogItem[];
  publishers: CatalogItem[];
  genres: CatalogItem[];
  onSaved: () => void;
  onClose: () => void;
  onCatalogItemCreated: (kind: CatalogKind, item: CatalogItem) => void;
}

export function BookFormDialog({
  open,
  book,
  authors,
  publishers,
  genres,
  onSaved,
  onClose,
  onCatalogItemCreated,
}: BookFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {open && (
          <BookFormPanel
            book={book}
            authors={authors}
            publishers={publishers}
            genres={genres}
            onSaved={onSaved}
            onCancel={onClose}
            onCatalogItemCreated={onCatalogItemCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
