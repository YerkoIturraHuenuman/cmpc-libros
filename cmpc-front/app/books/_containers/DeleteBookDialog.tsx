'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useDeleteBook } from '../_hooks/useDeleteBook';
import type { Book } from '../_services/booksService';

interface DeleteBookDialogProps {
  book: Book | null;
  onDeleted: () => void;
  onClose: () => void;
}

export function DeleteBookDialog({ book, onDeleted, onClose }: DeleteBookDialogProps) {
  return (
    <AlertDialog open={book !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        {book && <DeleteBookContent book={book} onDeleted={onDeleted} />}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteBookContent({ book, onDeleted }: { book: Book; onDeleted: () => void }) {
  const { confirmDelete, isDeleting } = useDeleteBook(book, onDeleted);

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>¿Eliminar este libro?</AlertDialogTitle>
        <AlertDialogDescription>
          «{book.title}» dejará de aparecer en el listado.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
        <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
          {isDeleting ? 'Eliminando…' : 'Eliminar'}
        </Button>
      </AlertDialogFooter>
    </>
  );
}
