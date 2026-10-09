import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Play, Radio } from 'lucide-react';
import { Badge, Button, cx } from '../ui';
import { adminApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { formatInr, formatNumber, idOf, timeAgo } from '../../lib/format';

const TIER_STYLE = {
  HOT: ['bg-rose-500', 'Hot — tracked by users'],
  NORMAL: ['bg-brand-500', 'Normal'],
  COLD: ['bg-slate-400', 'Cold — hidden products'],
};

/**
 * Live view of the adaptive price monitor: queue, demand tiers, the run in progress and the
 * latest price moves. Polls fast while a run is active, slowly otherwise.
 */
export default function LiveMonitor({ onRunFinished }) {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [starting, setStarting] = useState(false);
  const running = Boolean(status?.currentRun);

  useEffect(() => {
    let stopped = false;
    let timer;
    let wasRunning = false;
    const load = async () => {
      try {
        const s = await adminApi.monitoringStatus();
        if (stopped) return;
        setStatus(s);
        if (wasRunning && !s.currentRun) onRunFinished?.();
        wasRunning = Boolean(s.currentRun);
      } catch {
        /* keep last snapshot */
      }
      if (!stopped) timer = setTimeout(load, wasRunning ? 3000 : 20000);
    };
    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [onRunFinished]);

  const runNow = async () => {
    setStarting(true);
    try {
      await adminApi.runMonitor();
      toast.info('Checking due listings…');
      setStatus((s) => (s ? { ...s, currentRun: { total: s.schedule?.dueNow || 0, checked: 0, changed: 0, failed: 0 } } : s));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStarting(false);
    }
  };

  const sched = status?.schedule;
  const run = status?.currentRun;
  const last = status?.lastRun;
  const tierTotal = Object.values(sched?.tiers || {}).reduce((a, b) => a + b, 0) || 1;
  const progress = run?.total ? Math.round(((run.checked + run.failed) / run.total) * 100) : 0;

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span className={cx('relative grid size-9 place-items-center rounded-xl', running ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
          <Radio className="size-4.5" />
          {running ? <span className="absolute top-1 right-1 size-2 animate-ping rounded-full bg-emerald-500" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Live price monitor</h3>
          <p className="text-xs text-slate-500">
            {running ? 'Checking prices now' : `Idle · next tick on schedule (${sched?.tickCron || '—'})`}
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={runNow} loading={starting} disabled={running || !sched?.dueNow}>
          <Play className="size-3.5" /> Check {formatNumber(sched?.dueNow ?? 0)} due now
        </Button>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Queue</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-2xl font-bold">{formatNumber(sched?.dueNow)}</p>
              <p className="text-xs text-slate-500">due now</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-2xl font-bold">{formatNumber(sched?.dueNextHour)}</p>
              <p className="text-xs text-slate-500">due next hour</p>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Demand tiers</p>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
            {Object.entries(TIER_STYLE).map(([tier, [cls]]) =>
              sched?.tiers?.[tier] ? <div key={tier} className={cls} style={{ width: `${(sched.tiers[tier] / tierTotal) * 100}%` }} /> : null
            )}
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            {Object.entries(TIER_STYLE).map(([tier, [cls, label]]) => (
              <li key={tier} className="flex items-center gap-2">
                <span className={cx('size-2 rounded-full', cls)} />
                <span className="text-slate-600">{label}</span>
                <span className="ml-auto text-slate-400">every {sched?.intervalsMin?.[tier] ?? '—'} min</span>
                <span className="w-8 text-right font-semibold tabular-nums">{sched?.tiers?.[tier] || 0}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{running ? 'Current run' : 'Last run'}</p>
          {run || last ? (
            <div className="mt-2 rounded-xl border border-slate-200 p-4">
              {run ? (
                <>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold">
                      {formatNumber(run.checked + run.failed)} / {formatNumber(run.total)}
                    </span>
                    <span className="text-slate-500">{progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Finished {timeAgo(last.finishedAt)}
                  {last.force ? ' · full refresh' : ''}
                </p>
              )}
              {(() => {
                const r = run || last;
                return (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="green">{r.changed || 0} changed</Badge>
                    <Badge>{r.unchanged || 0} unchanged</Badge>
                    {r.failed ? <Badge tone="red">{r.failed} failed</Badge> : null}
                    {r.skippedForBudget ? <Badge tone="amber">{r.skippedForBudget} deferred</Badge> : null}
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No run since the server started.</p>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Activity className="size-3.5" /> Last check {timeAgo(status?.lastCheckedAt)}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Latest price moves</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {(status?.recentChanges || []).slice(0, 6).map((h) => (
              <li key={h._id} className="flex items-center gap-2 py-2 text-sm">
                <Link to={`/products/${idOf(h.productId)}`} target="_blank" className="min-w-0 flex-1 truncate hover:text-brand-700">
                  {h.productId?.title || 'Product'}
                </Link>
                <span className="shrink-0 text-xs text-slate-400">{h.storeId?.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">{formatInr(h.newPrice)}</span>
                <span className={cx('w-12 shrink-0 text-right text-xs font-semibold tabular-nums', h.percentageChange < 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {h.percentageChange > 0 ? '+' : ''}
                  {h.percentageChange}%
                </span>
              </li>
            ))}
            {status && !status.recentChanges?.length ? <li className="py-2 text-sm text-slate-500">No price moves yet.</li> : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
