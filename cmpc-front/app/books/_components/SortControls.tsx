import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BookSort, SortField } from '../_services/booksService';
import { SORT_FIELDS, nextFreeField } from '../_utils/sortFields';
import { OptionSelect } from './OptionSelect';

interface SortControlsProps {
  sort: BookSort[];
  onChange: (sort: BookSort[]) => void;
}

export function SortControls({ sort, onChange }: SortControlsProps) {
  const addable = nextFreeField(sort);

  const update = (index: number, change: Partial<BookSort>) =>
    onChange(sort.map((item, i) => (i === index ? { ...item, ...change } : item)));

  const optionsFor = (current: SortField) =>
    SORT_FIELDS.filter(
      ({ field }) => field === current || !sort.some((item) => item.field === field),
    ).map(({ field, label }) => ({ value: field, label }));

  return (
    <div className="grid gap-2">
      {sort.length === 0 && (
        <p className="text-sm text-muted-foreground">Por defecto: los más recientes primero.</p>
      )}

      {sort.map((item, index) => (
        <div key={item.field} className="flex gap-1.5">
          <OptionSelect
            value={item.field}
            onValueChange={(field) => update(index, { field: field as SortField })}
            options={optionsFor(item.field)}
            placeholder="Campo"
            ariaLabel={`Campo del criterio ${index + 1}`}
          />
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() =>
              update(index, { direction: item.direction === 'asc' ? 'desc' : 'asc' })
            }
            aria-label={`Criterio ${index + 1}: ${
              item.direction === 'asc' ? 'ascendente' : 'descendente'
            }. Cambiar dirección`}
            title={item.direction === 'asc' ? 'Ascendente' : 'Descendente'}
          >
            {item.direction === 'asc' ? <ArrowUp /> : <ArrowDown />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => onChange(sort.filter((_, i) => i !== index))}
            aria-label={`Quitar criterio ${index + 1}`}
            title="Quitar"
          >
            <X />
          </Button>
        </div>
      ))}

      {addable && (
        <Button
          variant="outline"
          size="sm"
          className="justify-self-start"
          onClick={() => onChange([...sort, { field: addable, direction: 'asc' }])}
        >
          <Plus /> Agregar criterio
        </Button>
      )}
    </div>
  );
}
