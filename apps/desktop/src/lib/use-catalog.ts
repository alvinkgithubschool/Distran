import { useEffect, useState } from 'react';
import {
  catalogApiUrl,
  searchLiveCatalog,
  fetchWork,
  invalidateCatalogResponses,
} from './catalog-api';
import type { SearchResult } from './catalog-api';
import { getWork, isRemoteId, canonicalWorkId } from './catalog';
export function useLiveSearch(
  query: string,
  medium: 'all' | 'game' | 'movie' | 'tv',
  page: number,
  retry: number,
  enabled = true,
) {
  const [state, setState] = useState<{
    key: string;
    result: SearchResult | null;
    loading: boolean;
    error: string;
  }>({ key: '', result: null, loading: false, error: '' });
  useEffect(() => {
    if (retry > 0) invalidateCatalogResponses();
  }, [retry]);
  const key = JSON.stringify([query, medium, page, retry, enabled]);
  useEffect(() => {
    if (!catalogApiUrl || !enabled) return;
    const controller = new AbortController();
    setState({ key, result: null, loading: true, error: '' });
    const timer = setTimeout(
      () => {
        searchLiveCatalog(query, medium, page, controller.signal)
          .then((result) => {
            if (!controller.signal.aborted) setState({ key, result, loading: false, error: '' });
          })
          .catch((error) => {
            if (!controller.signal.aborted)
              setState({ key, result: null, loading: false, error: (error as Error).message });
          });
      },
      query ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, query, medium, page, enabled]);
  return state.key === key
    ? state
    : { key, result: null, loading: !!catalogApiUrl && enabled, error: '' };
}
export function useLiveWork(alias: string) {
  const id = canonicalWorkId(alias);
  const [state, setState] = useState({ id: '', loading: false, error: '', cache: '' });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (retry > 0) invalidateCatalogResponses();
  }, [retry]);
  useEffect(() => {
    if (!isRemoteId(id)) return;
    const controller = new AbortController();
    setState({ id, loading: true, error: '', cache: '' });
    fetchWork(id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted)
          setState({ id, loading: false, error: '', cache: result.cache });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ id, loading: false, error: (error as Error).message, cache: '' });
      });
    return () => controller.abort();
  }, [id, retry]);
  return {
    work: getWork(id),
    loading: state.id === id && state.loading,
    error: state.id === id ? state.error : '',
    cache: state.cache,
    retry: () => setRetry((v) => v + 1),
  };
}
