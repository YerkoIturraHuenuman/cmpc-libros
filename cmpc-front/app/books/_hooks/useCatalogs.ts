'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/utils/errorMessage';
import { catalogService, type CatalogItem, type CatalogKind } from '../_services/catalogService';

interface Catalogs {
  authors: CatalogItem[];
  publishers: CatalogItem[];
  genres: CatalogItem[];
}

const EMPTY: Catalogs = { authors: [], publishers: [], genres: [] };

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState<Catalogs>(EMPTY);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    Promise.all([
      catalogService.list('authors', signal),
      catalogService.list('publishers', signal),
      catalogService.list('genres', signal),
    ])
      .then(([authors, publishers, genres]) =>
        setCatalogs({ authors, publishers, genres }),
      )
      .catch((error) => {
        if (!signal.aborted) {
          toast.error(getErrorMessage(error, 'No se pudieron cargar los filtros'));
        }
      });

    return () => controller.abort();
  }, []);

  const addItem = useCallback(
    (kind: CatalogKind, item: CatalogItem) =>
      setCatalogs((prev) => ({
        ...prev,
        [kind]: [...prev[kind], item].sort((a, b) => a.name.localeCompare(b.name, 'es')),
      })),
    [],
  );

  return { ...catalogs, addItem };
}
