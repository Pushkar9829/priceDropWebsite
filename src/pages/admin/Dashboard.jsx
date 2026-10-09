import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BellRing, ListChecks, Package, RefreshCw, RotateCcw, Store, Tag, Users } from 'lucide-react';
import { Button, ErrorBanner, Skeleton, StatusBadge, cx } from '../../components/ui';
import { StatCard, useJob } from '../../components/admin/kit';
import LiveMonitor from '../../components/admin/LiveMonitor';
import { adminApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { formatNumber, timeAgo } from '../../lib/format';

const SEGMENTS = [
  ['success', 'Healthy', 'bg-emerald-500'],
  ['outOfStock', 'Out of stock', 'bg-sky-400'],
  ['pending', 'Pending', 'bg-amber-400'],
  ['failed', 'Failed', 'bg-rose-500'],
  ['productNotFound', 'Not found', 'bg-rose-300'],
];

function JobBanner({ jobId, onDone }) {
  const job = useJob(jobId, { onDone });
  if (!job) return null;
  const s = job.result?.summary;
  return (
    <div className={cx('flex items-center gap-3 rounded-xl border px-4 py-3 text-sm', job.status === 'failed' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-brand-200 bg-brand-50 text-brand-800')}>
      {job.status === 'running' ? <RefreshCw className="size-4 animate-spin" /> : null}
      <span className="font-medium">{job.label}</span>
      <StatusBadge status={job.status} />
      {s ? (
        <span className="text-slate-600">
          {s.checked} checked · {s.changed} changed · {s.failed} failed
        </span>
      ) : null}
      {job.result?.total != null && !s ? <span className="text-slate-600">{job.result.total} retried</span> : null}
      {job.error ? <span>{job.error}</span> : null}
    </div>
  );
}

export default function Dashboard() {
  useDocumentTitle('Admin');
  const toast = useToast();
  const stats = useAsync(() => adminApi.dashboard(), []);
  const health = useAsync(() => adminApi.scraperHealth(), []);
  const [jobId, setJobId] = useState(null);
  const [starting, setStarting] = useState('');

  const start = async (kind) => {
    setStarting(kind);
    try {
      const res = kind === 'refresh' ? await adminApi.refreshAll() : await adminApi.retryFailed(100);
      setJobId(res.job.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStarting('');
    }
  };

  const reloadAll = useCallback(() => {
    stats.reload();
    health.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = stats.data;
  const m = d?.monitoring;
  const total = m?.totalActiveStoreProducts || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-slate-500">Last price check {timeAgo(m?.lastCheckedAt)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => start('retry')} loading={starting === 'retry'}>
            <RotateCcw className="size-4" /> Retry failed
          </Button>
          <Button onClick={() => start('refresh')} loading={starting === 'refresh'}>
            <RefreshCw className="size-4" /> Refresh all prices
          </Button>
        </div>
      </div>

      {jobId ? (
        <JobBanner
          jobId={jobId}
          onDone={(j) => {
            if (j.status === 'completed') toast.success(`${j.label} finished`);
            stats.reload();
            health.reload();
          }}
        />
      ) : null}
      <ErrorBanner error={stats.error} onRetry={stats.reload} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.loading && !d ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard label="Products" value={formatNumber(d?.products)} icon={Package} />
            <StatCard label="Store listings" value={formatNumber(d?.storeProducts)} icon={ListChecks} tone="slate" />
            <StatCard label="Active stores" value={formatNumber(d?.stores)} icon={Store} tone="slate" />
            <StatCard label="Users" value={formatNumber(d?.users)} icon={Users} tone="slate" />
            <StatCard label="Active alerts" value={formatNumber(d?.alerts)} icon={BellRing} tone="amber" />
            <StatCard label="Active deals" value={formatNumber(d?.deals)} icon={Tag} tone="green" />
            <StatCard label="Repeated failures" value={formatNumber(m?.repeatedFailures)} hint="3+ consecutive failed checks" icon={AlertTriangle} tone="red" />
            <StatCard label="Stale > 24h" value={formatNumber(m?.staleOver24h)} hint={`${formatNumber(m?.neverChecked)} never checked`} icon={RefreshCw} tone="amber" />
          </>
        )}
      </div>

      <LiveMonitor onRunFinished={reloadAll} />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="card p-5">
          <h3 className="font-semibold">Listing health</h3>
          <p className="text-sm text-slate-500">{formatNumber(total)} active listings by last scrape status</p>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100">
            {total
              ? SEGMENTS.map(([key, , cls]) =>
                  m?.[key] ? <div key={key} className={cls} style={{ width: `${(m[key] / total) * 100}%` }} title={`${key}: ${m[key]}`} /> : null
                )
              : null}
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-3 text-sm">
            {SEGMENTS.map(([key, label, cls]) => (
              <li key={key} className="flex items-center gap-2">
                <span className={cx('size-2.5 rounded-full', cls)} />
                <span className="text-slate-600">{label}</span>
                <span className="ml-auto font-semibold tabular-nums">{formatNumber(m?.[key] ?? 0)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="font-semibold">Stores</h3>
            <Link to="/admin/health" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Details
            </Link>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {(health.data?.storeHealth || []).map((s) => {
              const rate = s.total ? Math.round((s.success / s.total) * 100) : 0;
              return (
                <div key={s.storeId} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <span className="w-24 font-medium">{s.store?.name || 'Unknown'}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={cx('h-full rounded-full', rate > 80 ? 'bg-emerald-500' : rate > 50 ? 'bg-amber-400' : 'bg-rose-500')} style={{ width: `${rate}%` }} />
                  </div>
                  <span className="w-12 text-right font-semibold tabular-nums">{rate}%</span>
                  <span className="hidden w-28 text-right text-xs text-slate-500 sm:block">{s.total} listings</span>
                </div>
              );
            })}
            {!health.loading && !health.data?.storeHealth?.length ? <p className="px-5 py-6 text-sm text-slate-500">No listings yet.</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
