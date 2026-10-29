import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PageMeta } from '@/services/httpClient';

interface BooksPaginationProps {
  meta: PageMeta | null;
  isLoading: boolean;
  onPage: (page: number) => void;
}

export function BooksPagination({ meta, isLoading, onPage }: BooksPaginationProps) {
  if (!meta || meta.total === 0) return null;

  const from = (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-muted-foreground">
        Mostrando {from}–{to} de {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          onClick={() => onPage(meta.page - 1)}
          disabled={isLoading || meta.page <= 1}
        >
          <ChevronLeft />
        </Button>
        <span>
          Página {meta.page} de {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Página siguiente"
          onClick={() => onPage(meta.page + 1)}
          disabled={isLoading || meta.page >= meta.totalPages}
        >
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
