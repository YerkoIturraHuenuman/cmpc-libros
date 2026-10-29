import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BookSort } from '../_services/booksService';
import { SORT_PRESETS, findPreset } from '../_utils/sortPresets';

interface SortMenuProps {
  sort: BookSort[];
  onChange: (sort: BookSort[]) => void;
  onCustom: () => void;
}

const ITEM_CLASS = 'data-[state=checked]:font-semibold';

export function SortMenu({ sort, onChange, onCustom }: SortMenuProps) {
  const active = findPreset(sort);
  const label = active ? active.label : 'Personalizado';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label={`Ordenar por: ${label}`} className="font-normal">
          <span className="text-muted-foreground">Ordenar por</span>
          <span className="font-semibold">{label}</span>
          <ChevronDown className="opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-72">
        {SORT_PRESETS.map((preset) => (
          <DropdownMenuCheckboxItem
            key={preset.id}
            checked={active?.id === preset.id}
            onSelect={() => onChange(preset.sort)}
            className={ITEM_CLASS}
          >
            {preset.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={active === null} onSelect={onCustom} className={ITEM_CLASS}>
          Personalizado…
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
