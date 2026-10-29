import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookActionsProps {
  title: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function BookActions({ title, onEdit, onDelete }: BookActionsProps) {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onEdit}
        aria-label={`Editar ${title}`}
        title="Editar"
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        aria-label={`Eliminar ${title}`}
        title="Eliminar"
      >
        <Trash2 />
      </Button>
    </div>
  );
}
