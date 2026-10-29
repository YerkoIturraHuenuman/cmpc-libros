'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Page } from '@/services/httpClient';
import { getErrorMessage } from '@/utils/errorMessage';
import {
  booksService,
  type Book,
  type BookListParams,
  type BookSort,
} from '../_services/booksService';
import {
  DEFAULT_QUERY,
  hasActiveFilters,
  toFiltersParams,
  toListParams,
  type BooksQuery,
} from '../_utils/booksQuery';
import { useDebouncedValue } from './useDebouncedValue';

export const FILTER_DEBOUNCE_MS = 350;

interface Result {
  key: string;
  page?: Page<Book>;
  error?: string;
}

type FiltersState = Pick<
  BooksQuery,
  'search' | 'genreIds' | 'publisherIds' | 'authorIds' | 'availability'
>;

const pickFilters = ({
  search,
  genreIds,
  publisherIds,
  authorIds,
  availability,
}: BooksQuery): FiltersState => ({ search, genreIds, publisherIds, authorIds, availability });

export type FilterKey = 'genreIds' | 'publisherIds' | 'authorIds' | 'availability';

export function useBooksList() {
  const [query, setQuery] = useState<BooksQuery>(DEFAULT_QUERY);
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  const filtersKey = JSON.stringify(pickFilters(query));
  const settledKey = useDebouncedValue(filtersKey, FILTER_DEBOUNCE_MS);
  const isSettling = filtersKey !== settledKey;
  const settled: FiltersState = JSON.parse(settledKey);

  const effective = { ...query, ...settled };
  const paramsKey = JSON.stringify(toListParams(effective));
  const requestKey = `${paramsKey}#${reloadToken}`;

  useEffect(() => {
    if (isSettling) return undefined;
    const params: BookListParams = JSON.parse(paramsKey);
    const controller = new AbortController();

    booksService
      .list(params, controller.signal)
      .then((page) => setResult({ key: requestKey, page }))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({ key: requestKey, error: getErrorMessage(error) });
        }
      });

    return () => controller.abort();
  }, [paramsKey, requestKey, isSettling]);

  const setSearch = useCallback(
    (value: string) => setQuery((prev) => ({ ...prev, search: value, page: 1 })),
    [],
  );

  const setFilter = useCallback(
    <K extends FilterKey>(key: K, value: BooksQuery[K]) =>
      setQuery((prev) => ({ ...prev, [key]: value, page: 1 })),
    [],
  );

  const setSort = useCallback(
    (sort: BookSort[]) => setQuery((prev) => ({ ...prev, sort, page: 1 })),
    [],
  );

  const goToPage = useCallback(
    (page: number) => setQuery((prev) => ({ ...prev, page })),
    [],
  );

  const clearFilters = useCallback(
    () => setQuery((prev) => ({ ...DEFAULT_QUERY, sort: prev.sort })),
    [],
  );

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const isCurrent = result?.key === requestKey;
  const page = result?.page;

  return {
    query,
    books: page?.items ?? [],
    meta: page?.meta ?? null,
    isLoading: !isCurrent || isSettling,
    error: isCurrent ? (result?.error ?? null) : null,
    hasFilters: hasActiveFilters(query),
    exportParams: toFiltersParams(effective),
    setSearch,
    setFilter,
    setSort,
    goToPage,
    clearFilters,
    reload,
  };
}
