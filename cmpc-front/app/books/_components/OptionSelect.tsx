'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/utils/cn';
import { ALL } from '../_utils/booksQuery';

interface Option {
  value: string;
  label: string;
}

interface OptionSelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  allLabel?: string;
  invalid?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function OptionSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  allLabel,
  invalid,
  ariaLabel,
  className,
}: OptionSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        className={cn('w-full', className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
