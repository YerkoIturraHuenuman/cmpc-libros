'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { CatalogItem, CatalogKind } from '../_services/catalogService';
import { CatalogItemPanel } from './CatalogItemPanel';

interface CatalogItemDialogProps {
  kind: CatalogKind | null;
  onCreated: (kind: CatalogKind, item: CatalogItem) => void;
  onClose: () => void;
}

export function CatalogItemDialog({ kind, onCreated, onClose }: CatalogItemDialogProps) {
  return (
    <Dialog open={kind !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        {kind && (
          <CatalogItemPanel
            kind={kind}
            onCreated={(item) => onCreated(kind, item)}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
