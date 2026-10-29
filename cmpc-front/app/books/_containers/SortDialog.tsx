import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SortControls } from '../_components/SortControls';
import type { BookSort } from '../_services/booksService';

interface SortDialogProps {
  open: boolean;
  sort: BookSort[];
  onChange: (sort: BookSort[]) => void;
  onClose: () => void;
}

export function SortDialog({ open, sort, onChange, onClose }: SortDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Orden personalizado</DialogTitle>
          <DialogDescription>
            Combina hasta tres campos: el primero manda y los siguientes desempatan.
          </DialogDescription>
        </DialogHeader>
        <SortControls sort={sort} onChange={onChange} />
        <DialogFooter>
          <Button onClick={onClose}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
