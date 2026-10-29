'use client';

import { SessionGuard } from '@/app/(auth)/_containers/SessionGuard';
import { useBooksPage } from '../_hooks/useBooksPage';
import { BookDetailDialog } from '../_containers/BookDetailDialog';
import { BookFormDialog } from '../_containers/BookFormDialog';
import { BooksCatalog } from '../_containers/BooksCatalog';
import { BooksPagination } from '../_containers/BooksPagination';
import { BooksSidebar } from '../_containers/BooksSidebar';
import { BooksToolbar } from '../_containers/BooksToolbar';
import { DeleteBookDialog } from '../_containers/DeleteBookDialog';
import { SortDialog } from '../_containers/SortDialog';

export default function BooksPage() {
  const {
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
    openCreate,
    openSort,
    openDetail,
    openEdit,
    openDelete,
  } = useBooksPage();

  const formOpen = dialog?.type === 'create' || dialog?.type === 'edit';

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[20rem_1fr]">
      <SessionGuard />
      <BooksSidebar
        query={list.query}
        authors={catalogs.authors}
        publishers={catalogs.publishers}
        genres={catalogs.genres}
        hasFilters={list.hasFilters}
        onSearch={list.setSearch}
        onFilter={list.setFilter}
        onClear={list.clearFilters}
        onExport={exporter.exportCsv}
        isExporting={exporter.isExporting}
        onLogout={session.logout}
        isLoggingOut={session.isLoggingOut}
      />

      <main className="grid min-w-0 content-start gap-6 p-4 sm:p-8">
        <BooksToolbar
          total={list.meta?.total ?? null}
          sort={list.query.sort}
          onSortChange={list.setSort}
          onCustomSort={openSort}
          view={view}
          onViewChange={setView}
          onCreate={openCreate}
        />
        <BooksCatalog
          books={list.books}
          view={view}
          isLoading={list.isLoading}
          error={list.error}
          onView={openDetail}
          onEdit={openEdit}
          onDelete={openDelete}
          onRetry={list.reload}
        />
        <BooksPagination meta={list.meta} isLoading={list.isLoading} onPage={list.goToPage} />
      </main>

      <BookFormDialog
        open={formOpen}
        book={dialog?.type === 'edit' ? dialog.book : null}
        authors={catalogs.authors}
        publishers={catalogs.publishers}
        genres={catalogs.genres}
        onSaved={onSaved}
        onClose={closeDialog}
        onCatalogItemCreated={catalogs.addItem}
      />
      <SortDialog
        open={dialog?.type === 'sort'}
        sort={list.query.sort}
        onChange={list.setSort}
        onClose={closeDialog}
      />
      <BookDetailDialog
        book={dialog?.type === 'detail' ? dialog.book : null}
        onClose={closeDialog}
      />
      <DeleteBookDialog
        book={dialog?.type === 'delete' ? dialog.book : null}
        onDeleted={onDeleted}
        onClose={closeDialog}
      />
    </div>
  );
}
