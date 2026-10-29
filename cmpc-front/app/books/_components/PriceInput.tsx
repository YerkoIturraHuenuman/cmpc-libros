'use client';

import { Input } from '@/components/ui/input';
import {
  caretFor,
  cleanPriceInput,
  countSignificant,
  formatPriceInput,
} from '../_utils/priceInput';

interface PriceInputProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function PriceInput({ value, onChange, ...props }: PriceInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const caret = input.selectionStart as number;
    const significant = countSignificant(input.value.slice(0, caret));
    const next = cleanPriceInput(input.value);

    onChange(next);
    const position = caretFor(formatPriceInput(next), significant);
    requestAnimationFrame(() => input.setSelectionRange(position, position));
  };

  return (
    <Input
      {...props}
      value={formatPriceInput(value)}
      onChange={handleChange}
      inputMode="decimal"
      autoComplete="off"
    />
  );
}
