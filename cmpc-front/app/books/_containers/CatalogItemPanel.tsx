'use client';

import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CatalogItemForm } from '../_components/CatalogItemForm';
import { useCatalogItemForm } from '../_hooks/useCatalogItemForm';
import type { CatalogItem, CatalogKind } from '../_services/catalogService';
import { CATALOG_LABELS } from '../_utils/catalogLabels';

interface CatalogItemPanelProps {
  kind: CatalogKind;
  onCreated: (item: CatalogItem) => void;
  onCancel: () => void;
}

export function CatalogItemPanel({ kind, onCreated, onCancel }: CatalogItemPanelProps) {
  const { form, onSubmit, serverError, isSubmitting } = useCatalogItemForm(kind, onCreated);
  const { singular, placeholder } = CATALOG_LABELS[kind];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nuevo {singular}</DialogTitle>
        <DialogDescription>
          Quedará disponible para elegirlo en cualquier libro.
        </DialogDescription>
      </DialogHeader>
      <CatalogItemForm
        form={form}
        label={singular}
        placeholder={placeholder}
        onSubmit={onSubmit}
        onCancel={onCancel}
        serverError={serverError}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
