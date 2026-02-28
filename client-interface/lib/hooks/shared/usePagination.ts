import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  offset: number;
  queryParams: { page: number; limit: number };
  setTotal: (total: number | ((prev: number) => number)) => void;
  setLimit: (limit: number) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
}: UsePaginationOptions = {}): PaginationState {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [total, setTotalState] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const setTotal = useCallback((value: number | ((prev: number) => number)) => {
    setTotalState(value);
  }, []);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPage(1); // reset to page 1 when page size changes
  }, []);

  const goToPage = useCallback(
    (target: number) => {
      setPage(Math.max(1, Math.min(target, Math.max(1, Math.ceil(total / limit)))));
    },
    [total, limit]
  );

  const nextPage = useCallback(() => {
    setPage((p) => (p < totalPages ? p + 1 : p));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((p) => (p > 1 ? p - 1 : p));
  }, []);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    offset: (page - 1) * limit,
    queryParams: { page, limit },
    setTotal,
    setLimit,
    goToPage,
    nextPage,
    prevPage,
    reset,
  };
}
