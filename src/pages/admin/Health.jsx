import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react';
import { Button, StatusBadge, cx } from '../../components/ui';
import { Cell, DataTable, StatCard, useJob } from '../../components/admin/kit';
import { adminApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { formatNumber, timeAgo } from '../../lib/format';

export default function Health() {
  useDocumentTitle('Scraper health');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [jobId, setJobId] = useState(null);
  const [busy, setBusy] = useState('');
  const health = useAsync(() => adminApi.scraperHealth(), []);
  const failed = useAsync(() => adminApi.failedChecks({ page, limit: 20 }), [page], { initial: { items: [], pages: 1 } });

  const job = useJob(jobId, {
    onDone: (j) => {
      toast[j.status === 'completed' ? 'success' : 'error'](j.status === 'completed' ? `Retried ${j.result?.total ?? 0} listings` : j.error);
      health.reload();
      failed.reload();
    },
  });

  const retryAll = async () => {
    setBusy('all');
    try {
      setJobId((await adminApi.retryFailed(100)).job.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const retryOne = async (row) => {
    setBusy(row._id);
    try {
      const res = await adminApi.retryOne(row._id);
      toast[res.result?.failed ? 'error' : 'success'](res.result?.failed ? `Still failing: ${res.result.error}` : 'Recovered');
      failed.reload();
      health.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const o = health.data?.overview;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Last successful fetch {timeAgo(o?.lastSuccessfulFetchAt)}</p>
        <Button onClick={retryAll} loading={busy === 'all' || job?.status === 'running'}>
          <RotateCcw className="size-4" /> Retry failed (100)
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Healthy" value={formatNumber(o?.success)} icon={CheckCircle2} tone="green" />
        <StatCard label="Failed" value={formatNumber((o?.failed || 0) + (o?.productNotFound || 0))} hint={`${formatNumber(o?.productNotFound)} not found`} icon={XCircle} tone="red" />
        <StatCard label="Repeated failures" value={formatNumber(o?.repeatedFailures)} hint="3+ in a row" icon={AlertTriangle} tone="amber" />
        <StatCard label="Stale > 24h" value={formatNumber(o?.staleOver24h)} hint={`${formatNumber(o?.pending)} pending`} icon={Clock} tone="slate" />
      </div>

      <section>
        <h3 className="mb-3 font-semibold">By store</h3>
        <DataTable
          loading={health.loading}
          error={health.error}
          onRetry={health.reload}
          rows={health.data?.storeHealth || []}
          rowKey={(r) => r.storeId}
          columns={[
            { key: 'store', header: 'Store', render: (r) => <span className="font-medium">{r.store?.name || 'Unknown'}</span> },
            { key: 'total', header: 'Listings', render: (r) => formatNumber(r.total) },
            {
              key: 'rate',
              header: 'Success rate',
              render: (r) => {
                const rate = r.total ? Math.round((r.success / r.total) * 100) : 0;
                return (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div className={cx('h-full', rate > 80 ? 'bg-emerald-500' : rate > 50 ? 'bg-amber-400' : 'bg-rose-500')} style={{ width: `${rate}%` }} />
                    </div>
                    <span className="tabular-nums">{rate}%</span>
                  </div>
                );
              },
            },
            { key: 'failed', header: 'Failed', render: (r) => <span className={r.failed ? 'font-semibold text-rose-600' : ''}>{r.failed}</span> },
            { key: 'avg', header: 'Avg. failure streak', render: (r) => r.avgConsecutiveFailures },
            { key: 'ok', header: 'Last success', render: (r) => <span className="text-xs text-slate-500">{timeAgo(r.lastSuccessfulFetchAt)}</span> },
          ]}
        />
      </section>

      <section>
        <h3 className="mb-3 font-semibold">Failing listings</h3>
        <DataTable
          loading={failed.loading}
          error={failed.error}
          onRetry={failed.reload}
          rows={failed.data.items}
          empty="No failing listings 🎉"
          page={page}
          pages={failed.data.pages}
          total={failed.data.total}
          onPage={setPage}
          columns={[
            { key: 'title', header: 'Listing', className: 'max-w-[20rem]', render: (r) => <Cell title={r.title} sub={r.storeId?.name} /> },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.scrapeStatus} /> },
            { key: 'streak', header: 'Streak', render: (r) => <span className="font-semibold text-rose-600">{r.consecutiveFailureCount}×</span> },
            {
              key: 'error',
              header: 'Last error',
              className: 'max-w-[18rem]',
              render: (r) => (
                <span className="line-clamp-2 text-xs text-slate-500" title={r.lastError}>
                  {r.lastError || '—'}
                </span>
              ),
            },
            { key: 'when', header: 'Failed', render: (r) => <span className="text-xs text-slate-500">{timeAgo(r.lastFailedFetchAt)}</span> },
            {
              key: 'retry',
              header: '',
              className: 'text-right',
              render: (r) => (
                <Button size="sm" variant="secondary" loading={busy === r._id} onClick={() => retryOne(r)}>
                  Retry
                </Button>
              ),
            },
          ]}
        />
      </section>
    </div>
  );
}
