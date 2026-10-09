import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Loader2, Radar, Search } from 'lucide-react';
import { Badge, Button, Input, StatusBadge, cx } from '../../components/ui';
import { useJob } from '../../components/admin/kit';
import { adminApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { formatInr, timeAgo } from '../../lib/format';

const STORES = [
  { slug: 'flipkart', label: 'Flipkart', hint: 'Most reliable' },
  { slug: 'amazon', label: 'Amazon', hint: 'May block bots' },
  { slug: 'croma', label: 'Croma', hint: 'May deny access' },
];
const LIMITS = ['10', '25', '50', '100', 'all'];

const detectStore = (url) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('flipkart.com')) return 'Flipkart';
    if (host.includes('amazon.')) return 'Amazon';
    if (host.includes('croma.com')) return 'Croma';
  } catch {
    /* not a URL yet */
  }
  return null;
};

function JobResult({ job }) {
  if (!job) return null;
  const r = job.result;
  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {job.status === 'running' ? <Loader2 className="size-4 animate-spin text-brand-600" /> : null}
        <span className="font-semibold">{job.label}</span>
        <StatusBadge status={job.status} />
        {job.status === 'running' && job.progress ? (
          <span className="text-slate-500">
            {job.progress.stage} {job.progress.store}… {job.progress.saved ?? 0} saved so far
          </span>
        ) : null}
        {job.error ? <span className="text-rose-600">{job.error}</span> : null}
      </div>
      {r ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="brand">{r.found} found</Badge>
            <Badge tone="green">{r.saved} saved</Badge>
            {r.skipped ? <Badge tone="amber">{r.skipped} skipped</Badge> : null}
            {Object.entries(r.byStore || {}).map(([slug, s]) => (
              <Badge key={slug}>
                {slug}: {s.saved}/{s.found}
                {s.errors?.length ? ` · ${s.errors.length} err` : ''}
              </Badge>
            ))}
          </div>
          {r.items?.length ? (
            <ul className="mt-3 max-h-72 divide-y divide-slate-200 overflow-y-auto rounded-lg border border-slate-200 bg-white text-sm">
              {r.items.slice(0, 100).map((it) => (
                <li key={it.storeProductId} className="flex items-center gap-3 px-3 py-2">
                  <Badge>{it.store}</Badge>
                  <Link to={`/products/${it.productId}`} target="_blank" className="min-w-0 flex-1 truncate hover:text-brand-700">
                    {it.title}
                  </Link>
                  {it.created ? <Badge tone="green">new</Badge> : null}
                  <span className="font-semibold tabular-nums">{formatInr(it.currentPrice)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {r.errors?.length ? (
            <details className="mt-3 text-xs text-rose-700">
              <summary className="cursor-pointer">{r.errors.length} error(s)</summary>
              <ul className="mt-2 space-y-1">
                {r.errors.slice(0, 20).map((e, i) => (
                  <li key={i}>
                    {e.store ? `[${e.store}] ` : ''}
                    {e.title ? `${e.title}: ` : ''}
                    {e.error}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default function Scraper() {
  useDocumentTitle('Live scraper');
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState('25');
  const [stores, setStores] = useState(['flipkart']);
  const [jobId, setJobId] = useState(null);
  const [starting, setStarting] = useState(false);
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(null);
  const jobs = useAsync(() => adminApi.jobs(), [], { initial: { items: [] } });

  const job = useJob(jobId, {
    onDone: (j) => {
      jobs.reload();
      if (j.status === 'completed') toast.success(`Saved ${j.result?.saved ?? 0} listings`);
      else toast.error(j.error || 'Scrape failed');
    },
  });
  const detected = useMemo(() => detectStore(url.trim()), [url]);
  const running = job?.status === 'running';

  const startScrape = async (e) => {
    e.preventDefault();
    if (!stores.length) {
      toast.error('Select at least one store');
      return;
    }
    setStarting(true);
    try {
      const res = await adminApi.scrapeByKeyword({ query: query.trim(), limit: limit === 'all' ? 'all' : Number(limit), stores });
      setJobId(res.job.id);
      jobs.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStarting(false);
    }
  };

  const importUrl = async (e) => {
    e.preventDefault();
    setImporting(true);
    setImported(null);
    try {
      const res = await adminApi.importStoreProduct({ url: url.trim() });
      setImported(res);
      setUrl('');
      toast.success(`Imported from ${res.store}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <form onSubmit={startScrape} className="card p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Radar className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">Scrape by keyword</h2>
              <p className="text-sm text-slate-500">Searches stores, saves matching listings, and the hourly cron keeps prices fresh.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input className="input pl-9" required placeholder="e.g. iphone 16, boat earbuds" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <select className="input w-full pr-8 sm:w-36" value={limit} onChange={(e) => setLimit(e.target.value)} aria-label="Results per store">
              {LIMITS.map((l) => (
                <option key={l} value={l}>
                  {l === 'all' ? 'All pages' : `${l} per store`}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {STORES.map((s) => {
              const on = stores.includes(s.slug);
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setStores((cur) => (on ? cur.filter((x) => x !== s.slug) : [...cur, s.slug]))}
                  className={cx(
                    'rounded-xl border px-3.5 py-2 text-left text-sm transition',
                    on ? 'border-brand-500 bg-brand-50 text-brand-800 ring-2 ring-brand-100' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  <span className="block font-semibold">{s.label}</span>
                  <span className="block text-xs opacity-70">{s.hint}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex justify-end">
            <Button type="submit" loading={starting || running} disabled={!query.trim()}>
              {running ? 'Scraping…' : 'Start scrape'}
            </Button>
          </div>
          <JobResult job={job} />
        </form>

        <form onSubmit={importUrl} className="card p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Link2 className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">Import a product URL</h2>
              <p className="text-sm text-slate-500">Paste an Amazon.in, Flipkart or Croma product page.</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
            <Input
              className="flex-1"
              type="url"
              required
              placeholder="https://www.flipkart.com/…/p/itm…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              hint={url ? (detected ? `Detected: ${detected}` : 'Unsupported store URL') : undefined}
            />
            <Button type="submit" loading={importing} disabled={!detected}>
              Import
            </Button>
          </div>
          {imported ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {imported.product?.created ? 'Created' : 'Linked to'}{' '}
              <Link to={`/products/${imported.product?.id}`} target="_blank" className="font-semibold underline">
                {imported.product?.title}
              </Link>{' '}
              at {formatInr(imported.storeProduct?.currentPrice)}
            </p>
          ) : null}
        </form>
      </div>

      <aside className="card h-fit p-5">
        <h3 className="font-semibold">Recent jobs</h3>
        <p className="text-xs text-slate-500">Jobs live in server memory and reset on restart.</p>
        <ul className="mt-4 space-y-2">
          {jobs.data.items.slice(0, 12).map((j) => (
            <li key={j.id}>
              <button
                type="button"
                onClick={() => setJobId(j.id)}
                className={cx('w-full rounded-xl border px-3 py-2.5 text-left text-sm transition hover:bg-slate-50', j.id === jobId ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{j.label}</span>
                  <StatusBadge status={j.status} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {timeAgo(j.createdAt)}
                  {j.result?.saved != null ? ` · ${j.result.saved} saved` : ''}
                </p>
              </button>
            </li>
          ))}
          {!jobs.data.items.length ? <li className="text-sm text-slate-500">No jobs yet.</li> : null}
        </ul>
      </aside>
    </div>
  );
}
