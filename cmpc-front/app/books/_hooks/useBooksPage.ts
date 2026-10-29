'use client';

import { useCallback, useState } from 'react';
import { useLogout } from '@/app/(auth)/_hooks/useLogout';
import type { Book } from '../_services/booksService';
import { DEFAULT_VIEW, type BooksView } from '../_utils/booksView';
import { useBooksList } from './useBooksList';
import { useCatalogs } from './useCatalogs';
import { useExportBooks } from './useExportBooks';

export type BookDialog =
  | { type: 'create' }
  | { type: 'sort' }
  | { type: 'detail' | 'edit' | 'delete'; book: Book }
  | null;

export function useBooksPage() {
  const list = useBooksList();
  const catalogs = useCatalogs();
  const exporter = useExportBooks(list.exportParams);
  const session = useLogout();
  const [dialog, setDialog] = useState<BookDialog>(null);
  const [view, setView] = useState<BooksView>(DEFAULT_VIEW);

  const { books, query, goToPage, reload } = list;

  const closeDialog = useCallback(() => setDialog(null), []);

  const onSaved = useCallback(() => {
    setDialog(null);
    reload();
  }, [reload]);

  const onDeleted = useCallback(() => {
    setDialog(null);
    if (books.length === 1 && query.page > 1) {
      goToPage(query.page - 1);
    } else {
      reload();
    }
  }, [books.length, query.page, goToPage, reload]);

  return {
    list,
    catalogs,
    exporter,
    session,
    dialog,
    view,
    setView,
    closeDialog,
    onSaved,
    onDeleted,
    openCreate: () => setDialog({ type: 'create' }),
    openSort: () => setDialog({ type: 'sort' }),
    openDetail: (book: Book) => setDialog({ type: 'detail', book }),
    openEdit: (book: Book) => setDialog({ type: 'edit', book }),
    openDelete: (book: Book) => setDialog({ type: 'delete', book }),
  };
}
