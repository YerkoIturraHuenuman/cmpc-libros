import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import type { BooksView } from '../_utils/booksView';

interface ViewToggleProps {
  view: BooksView;
  onChange: (view: BooksView) => void;
}

const OPTIONS: { view: BooksView; label: string; Icon: typeof LayoutGrid }[] = [
  { view: 'grid', label: 'Vista en cuadrícula', Icon: LayoutGrid },
  { view: 'list', label: 'Vista en lista', Icon: List },
];

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div role="group" aria-label="Vista" className="inline-flex gap-1 rounded-lg border bg-muted p-1">
      {OPTIONS.map(({ view: option, label, Icon }) => (
        <Button
          key={option}
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          title={label}
          aria-pressed={view === option}
          onClick={() => onChange(option)}
          className={cn(view === option && 'bg-card shadow-xs hover:bg-card')}
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}
