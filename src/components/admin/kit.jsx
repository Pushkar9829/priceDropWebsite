import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { EmptyState, ErrorBanner, Pagination, Skeleton, cx } from '../ui';
import { adminApi } from '../../lib/api';
import { useDebounced } from '../../lib/hooks';

export function StatCard({ label, value, hint, icon: Icon, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon ? (
          <span className={cx('grid size-9 place-items-center rounded-xl', tones[tone])}>
            <Icon className="size-4.5" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value ?? '—'}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }) {
  const [local, setLocal] = useState(value || '');
  const debounced = useDebounced(local, 350);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return (
    <div className={cx('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <input className="input pl-9" value={local} onChange={(e) => setLocal(e.target.value)} placeholder={placeholder} type="search" />
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}

/**
 * Table with loading / empty / error states and pagination.
 * columns: [{ key, header, render(row), className }]
 */
export function DataTable({ columns, rows, loading, error, onRetry, rowKey = (r) => r._id || r.id, empty, page, pages, total, onPage }) {
  return (
    <div className="card overflow-hidden">
      {error ? (
        <div className="p-4">
          <ErrorBanner error={error} onRetry={onRetry} />
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
              {columns.map((c) => (
                <th key={c.key} className={cx('px-4 py-3 whitespace-nowrap', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && !rows?.length
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key} className="px-4 py-3.5">
                        <Skeleton className="h-4 w-full max-w-[10rem]" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows?.map((row) => (
                  <tr key={rowKey(row)} className={cx('transition hover:bg-slate-50/70', loading && 'opacity-60')}>
                    {columns.map((c) => (
                      <td key={c.key} className={cx('px-4 py-3 align-middle', c.className)}>
                        {c.render ? c.render(row) : row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && !error && !rows?.length ? <EmptyState title={empty || 'Nothing here yet'} className="py-12" /> : null}
      {onPage ? (
        <div className="border-t border-slate-100 px-4 py-3">
          <Pagination page={page} pages={pages} total={total} onChange={onPage} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Poll a background admin job until it finishes. Returns the latest job snapshot.
 */
export function useJob(jobId, { onDone, interval = 2000 } = {}) {
  const [job, setJob] = useState(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      return undefined;
    }
    let stopped = false;
    let timer;
    const tick = async () => {
      try {
        const j = await adminApi.job(jobId);
        if (stopped) return;
        setJob(j);
        if (j.status === 'running') timer = setTimeout(tick, interval);
        else doneRef.current?.(j);
      } catch {
        if (!stopped) timer = setTimeout(tick, interval * 2);
      }
    };
    tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [jobId, interval]);

  return job;
}

export function Cell({ title, sub, className }) {
  return (
    <div className={cx('min-w-0', className)}>
      <p className="truncate font-medium text-slate-900">{title}</p>
      {sub ? <p className="truncate text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}
