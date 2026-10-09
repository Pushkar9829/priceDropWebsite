import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Run an async loader whenever deps change; exposes { data, error, loading, reload, setData }.
 * Stale responses from earlier deps are ignored.
 */
export function useAsync(loader, deps = [], { initial = null, enabled = true } = {}) {
  const [state, setState] = useState({ data: initial, error: null, loading: enabled });
  const run = useRef(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  /** reload({ silent: true }) refreshes in place without flipping `loading` (polling). */
  const reload = useCallback(({ silent = false } = {}) => {
    const id = ++run.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    return Promise.resolve()
      .then(() => loaderRef.current())
      .then(
        (data) => id === run.current && setState({ data, error: null, loading: false }),
        (error) => id === run.current && setState((s) => (silent ? s : { ...s, error, loading: false }))
      );
  }, []);

  useEffect(() => {
    if (!enabled) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), []);

  return { ...state, reload, setData };
}

export function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · PriceCompare` : 'PriceCompare — find the lowest price';
  }, [title]);
}
