import { useCallback, useEffect, useState } from 'react';
import { apiFetch, type ApiFetchOptions } from '../lib/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Data-fetching hook built on `apiFetch`. Pass `null` as path to skip fetching.
 * Replaces the copy-pasted loading/error `useState` blocks during page cleanup
 * (see REFACTOR_PLAN). Adoption is incremental.
 */
export function useApi<T = unknown>(path: string | null, options?: ApiFetchOptions) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: path !== null,
    error: null,
  });

  const refetch = useCallback(async () => {
    if (path === null) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiFetch<T>(path, options);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Erro' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
