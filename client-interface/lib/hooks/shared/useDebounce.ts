import { useState, useEffect } from 'react';

/**
 * Delays updating a value until the specified ms have passed
 * since the last change. Use this before firing API search calls.
 *
 * @example
 * const debouncedSearch = useDebounce(search, 400);
 * useEffect(() => { fetchData(debouncedSearch) }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}
