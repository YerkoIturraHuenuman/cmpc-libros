'use client';

import { useState } from 'react';
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookForm } from '../_components/BookForm';
import { BookImageField } from '../_components/BookImageField';
import { useBookForm } from '../_hooks/useBookForm';
import type { Book } from '../_services/booksService';
import type { CatalogItem, CatalogKind } from '../_services/catalogService';
import { CATALOG_LABELS } from '../_utils/catalogLabels';
import { CatalogItemDialog } from './CatalogItemDialog';

interface BookFormPanelProps {
  book: Book | null;
  authors: CatalogItem[];
  publishers: CatalogItem[];
  genres: CatalogItem[];
  onSaved: () => void;
  onCancel: () => void;
  onCatalogItemCreated: (kind: CatalogKind, item: CatalogItem) => void;
}

export function BookFormPanel({
  book,
  authors,
  publishers,
  genres,
  onSaved,
  onCancel,
  onCatalogItemCreated,
}: BookFormPanelProps) {
  const [creating, setCreating] = useState<CatalogKind | null>(null);
  const { form, image, onSubmit, serverError, isEditing, isSubmitting } =
    useBookForm(book, onSaved);

  const handleCatalogCreated = (kind: CatalogKind, item: CatalogItem) => {
    onCatalogItemCreated(kind, item);
    form.setValue(CATALOG_LABELS[kind].field, item.id, { shouldValidate: true, shouldDirty: true });
    setCreating(null);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Editar libro' : 'Nuevo libro'}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Modifica los datos del libro y guarda los cambios.'
            : 'Completa los datos para agregar un libro al inventario.'}
        </DialogDescription>
      </DialogHeader>
      <BookForm
        form={form}
        authors={authors}
        publishers={publishers}
        genres={genres}
        onSubmit={onSubmit}
        onCancel={onCancel}
        onAddCatalogItem={setCreating}
        serverError={serverError}
        isSubmitting={isSubmitting}
        isEditing={isEditing}
        imageField={
          <BookImageField
            title={form.watch('title')}
            shownUrl={image.shownUrl}
            hasCurrent={book?.imageUrl != null}
            removed={image.removed}
            error={image.error}
            onSelect={image.select}
            onClear={image.clear}
            onRestore={image.restore}
          />
        }
      />
      <CatalogItemDialog
        kind={creating}
        onCreated={handleCatalogCreated}
        onClose={() => setCreating(null)}
      />
    </>
  );
}
