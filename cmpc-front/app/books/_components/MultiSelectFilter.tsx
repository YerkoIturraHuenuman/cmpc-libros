'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectFilterProps {
  label: string;
  allLabel: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelectFilter({
  label,
  allLabel,
  options,
  selected,
  onChange,
}: MultiSelectFilterProps) {
  const chosen = options.filter((option) => selected.includes(option.value));
  const summary =
    chosen.length === 0
      ? allLabel
      : chosen.length === 1
        ? chosen[0].label
        : `${chosen.length} ${label}`;

  const toggle = (value: string, checked: boolean) =>
    onChange(checked ? [...selected, value] : selected.filter((item) => item !== value));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Filtrar por ${label}`}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-72 w-(--radix-dropdown-menu-trigger-width) min-w-52 overflow-y-auto"
      >
        {options.length === 0 && (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">Sin opciones</p>
        )}
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={(checked) => toggle(option.value, checked)}
            onSelect={(event) => event.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
