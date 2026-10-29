'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessage';
import { booksService, type Book } from '../_services/booksService';

export function useDeleteBook(book: Book, onDeleted: () => void) {
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await booksService.remove(book.id);
      toast.success(`«${book.title}» eliminado`);
      onDeleted();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo eliminar el libro'));
      setIsDeleting(false);
    }
  };

  return { confirmDelete, isDeleting };
}
