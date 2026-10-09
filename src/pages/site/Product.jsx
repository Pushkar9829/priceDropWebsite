import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  ChevronRight,
  Clock,
  ExternalLink,
  Heart,
  RefreshCw,
  Star,
  Trophy,
} from 'lucide-react';
import { Badge, Button, EmptyState, ErrorBanner, ProductThumb, Skeleton, StatusBadge, StoreLogo, cx } from '../../components/ui';
import { alertApi, notifyInboxChanged, productApi, watchlistApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import ProductCard from '../../components/site/ProductCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { discountPct, formatDate, formatInr, timeAgo } from '../../lib/format';

const PriceChart = lazy(() => import('../../components/site/PriceChart'));
const RANGES = [30, 90, 180, 365];

function Gallery({ images = [], title, brand }) {
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [images]);
  return (
    <div>
      <ProductThumb
        src={images[active]}
        alt={title}
        fallback={brand}
        className="aspect-square rounded-2xl border border-slate-200/80 shadow-card [&_img]:p-8"
      />
      {images.length > 1 ? (
        <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
          {images.slice(0, 8).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={cx(
                'size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition',
                i === active ? 'border-brand-500' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <img src={src} alt="" className="size-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ListingRow({ row, best }) {
  const oos = row.availability === 'OUT_OF_STOCK';
  const pct = discountPct(row.mrp, row.currentPrice);
  const diff = best && !row.isBestPrice && !oos ? row.currentPrice - best : 0;
  return (
    <div
      className={cx(
        'flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5',
        row.isBestPrice && 'bg-emerald-50/60',
        oos && 'opacity-60'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <StoreLogo store={row.store} size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{row.store?.name || 'Store'}</span>
            {row.isBestPrice ? (
              <Badge tone="green">
                <Trophy className="size-3" /> Lowest price
              </Badge>
            ) : null}
            {oos ? <StatusBadge status="OUT_OF_STOCK" /> : null}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            {row.seller ? <span className="truncate">Sold by {row.seller}</span> : null}
            {row.rating ? (
              <span className="inline-flex items-center gap-0.5">
                <Star className="size-3 fill-amber-400 text-amber-400" /> {row.rating}
                {row.reviewCount ? ` (${row.reviewCount.toLocaleString('en-IN')})` : ''}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> {timeAgo(row.lastCheckedAt)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-left sm:text-right">
          <div className="flex items-baseline gap-2 sm:justify-end">
            <span className={cx('text-xl font-bold', row.isBestPrice && 'text-emerald-700')}>{formatInr(row.currentPrice)}</span>
            {pct ? <span className="text-xs font-semibold text-emerald-600">{pct}% off</span> : null}
          </div>
          <div className="text-xs text-slate-500">
            {row.mrp && row.mrp > row.currentPrice ? <span className="line-through">{formatInr(row.mrp)}</span> : null}
            {diff > 0 ? <span className="ml-2 text-rose-500">+{formatInr(diff)} vs best</span> : null}
          </div>
        </div>
        <Button
          href={row.affiliateUrl || row.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          variant={row.isBestPrice ? 'success' : 'secondary'}
          className="w-28"
        >
          Visit <ExternalLink className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AlertCard({ productId, summary, stats, listings, myAlert, onChanged }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [storeProductId, setStoreProductId] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  // Once the user types, background price refreshes must not overwrite their value
  const [touched, setTouched] = useState(false);

  const lowest = summary?.lowestPrice;
  useEffect(() => {
    if (touched) return;
    // An existing alert pre-fills the form; otherwise suggest 5% below today's best
    if (myAlert) {
      setTarget(String(myAlert.targetPrice));
      setStoreProductId(myAlert.storeProductId ? String(myAlert.storeProductId) : '');
    } else {
      setStoreProductId('');
      if (lowest) setTarget(String(Math.floor(lowest * 0.95)));
    }
  }, [lowest, myAlert, touched]);
  // New product / alert removed → start fresh
  useEffect(() => {
    setTouched(false);
    setEditing(false);
  }, [productId, myAlert?._id]);

  const suggestions = [
    lowest && ['5% lower', Math.floor(lowest * 0.95)],
    lowest && ['10% lower', Math.floor(lowest * 0.9)],
    stats?.lowestHistoricalPrice && stats.lowestHistoricalPrice < lowest && ['Lowest ever', Math.floor(stats.lowestHistoricalPrice)],
  ].filter(Boolean);

  const submit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${productId}` } });
      return;
    }
    setBusy(true);
    try {
      const body = { targetPrice: Number(target) };
      // Same scope → update in place; changed store scope → replace the old alert
      const sameScope = myAlert && String(myAlert.storeProductId || '') === storeProductId;
      let saved;
      if (sameScope) {
        saved = await alertApi.update(myAlert._id, { ...body, status: 'ACTIVE' });
      } else {
        // Create the replacement first: if it fails the user keeps their existing alert
        saved = await alertApi.create({ productId, ...body, ...(storeProductId ? { storeProductId } : {}) });
        if (myAlert && saved?._id !== myAlert._id) await alertApi.remove(myAlert._id).catch(() => {});
      }
      if (saved?.status === 'TRIGGERED') {
        notifyInboxChanged();
        toast.success(`Price is already at or below ${formatInr(target)} — we've sent you a notification.`);
      } else {
        toast.success(`We'll alert you when the price drops to ${formatInr(target)}.`);
      }
      setEditing(false);
      setTouched(false);
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeAlert = async () => {
    setBusy(true);
    try {
      await alertApi.remove(myAlert._id);
      toast.info('Alert removed');
      onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (myAlert && !editing) {
    const store = listings.find((l) => String(l.storeProductId) === String(myAlert.storeProductId))?.store?.name;
    const reached = myAlert.status === 'TRIGGERED';
    return (
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <span className={cx('grid size-9 shrink-0 place-items-center rounded-xl', reached ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
            <BellRing className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">Your alert: {formatInr(myAlert.targetPrice)}</h3>
              <StatusBadge status={myAlert.status} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {reached
                ? `Target reached${myAlert.lastNotifiedAt ? ` · notified ${timeAgo(myAlert.lastNotifiedAt)}` : ''}`
                : myAlert.status === 'PAUSED'
                  ? 'Paused — you won’t be notified'
                  : `${store ? `Only ${store}` : 'Any store'} · we check this product every 30 min`}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Change target
          </Button>
          <Button variant="ghost" size="sm" onClick={removeAlert} loading={busy}>
            Remove
          </Button>
          <Button variant="ghost" size="sm" to="/alerts" className="ml-auto">
            All alerts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
          <BellRing className="size-4.5" />
        </span>
        <div>
          <h3 className="font-semibold">Price drop alert</h3>
          <p className="text-xs text-slate-500">Get notified when it hits your price</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-slate-400">₹</span>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={target}
            onChange={(e) => {
              setTouched(true);
              setTarget(e.target.value);
            }}
            className="input pl-7"
            aria-label="Target price"
          />
        </div>
        <Button type="submit" loading={busy}>
          {myAlert ? 'Save' : 'Set alert'}
        </Button>
        {myAlert ? (
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        ) : null}
      </div>
      {suggestions.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {suggestions.map(([label, value]) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setTouched(true);
                setTarget(String(value));
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              {label} · {formatInr(value)}
            </button>
          ))}
        </div>
      ) : null}
      {listings.length > 1 ? (
        <select
          className="input mt-3 h-9 text-xs"
          value={storeProductId}
          onChange={(e) => {
            setTouched(true);
            setStoreProductId(e.target.value);
          }}
          aria-label="Alert scope"
        >
          <option value="">Any store</option>
          {listings.map((l) => (
            <option key={l.storeProductId} value={l.storeProductId}>
              Only {l.store?.name}
            </option>
          ))}
        </select>
      ) : null}
    </form>
  );
}

export default function Product() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [days, setDays] = useState(90);
  const [storeFilter, setStoreFilter] = useState('');
  const [watched, setWatched] = useState(false);
  const [watchBusy, setWatchBusy] = useState(false);

  const detail = useAsync(() => productApi.get(id), [id, isAuthenticated]);
  const comparison = useAsync(() => productApi.comparison(id), [id]);
  const history = useAsync(
    () => productApi.priceHistory(id, { days, storeProductId: storeFilter || undefined }),
    [id, days, storeFilter]
  );

  // Ignore data from the previous id once this one has failed (e.g. navigating to a removed product)
  // Ignore data from the previous id: while the new product loads (or after it fails),
  // the old product's title/watch/alert state must not show — actions would hit the new id
  const fresh = detail.data?.product && String(detail.data.product._id) === String(id);
  const product = detail.error || !fresh ? null : detail.data.product;
  useDocumentTitle(product?.title || (detail.error ? 'Product not found' : ''));
  const similar = useAsync(() => productApi.similar(id), [id], { initial: { items: [] } });
  // Deep link from the watchlist ("Set alert") lands on the alert card once the page renders
  const location = useLocation();
  const layoutReady = Boolean(product) && !comparison.loading;
  useEffect(() => {
    if (!layoutReady || location.hash !== '#alert') return undefined;
    // Wait a frame so the comparison block has its final height before measuring
    const t = setTimeout(() => document.getElementById('alert')?.scrollIntoView({ block: 'start' }), 50);
    return () => clearTimeout(t);
  }, [layoutReady, location.hash]);
  useEffect(() => setWatched(Boolean(detail.data?.isWatched)), [detail.data]);

  // Live prices: the backend re-queues stale listings when this page is opened, so poll
  // quickly for a few minutes while that refresh lands, then slowly while the tab is visible.
  const refreshQueued = Boolean(detail.data?.freshness?.refreshQueued);
  // "Refreshing…" only during the fast-poll window after opening this product
  const openedAt = useMemo(() => Date.now(), [id]);
  useEffect(() => {
    const started = Date.now();
    let timer;
    const tick = () => {
      const fast = refreshQueued && Date.now() - started < 6 * 60 * 1000;
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          comparison.reload({ silent: true });
          history.reload({ silent: true });
        }
        tick();
      }, fast ? 20000 : 90000);
    };
    tick();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshQueued]);

  const summary = comparison.data?.summary;
  const listings = useMemo(() => comparison.data?.listings || [], [comparison.data]);
  const best = listings.find((l) => l.isBestPrice);
  const stats = history.data?.stats;
  const recent = useMemo(
    () => [...(history.data?.history || [])].filter((h) => h.changeType !== 'INITIAL').reverse().slice(0, 8),
    [history.data]
  );

  const toggleWatch = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    setWatchBusy(true);
    try {
      if (watched) {
        // Already removed (e.g. in another tab) is the outcome we wanted
        await watchlistApi.remove(id).catch((err) => {
          if (err.status !== 404) throw err;
        });
        setWatched(false);
        toast.info('Removed from watchlist');
      } else {
        await watchlistApi.add(id);
        setWatched(true);
        toast.success('Saved to watchlist');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWatchBusy(false);
    }
  };

  if (!product && !detail.error) {
    return (
      <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
        <Skeleton className="aspect-square" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="mt-8 h-24 w-full" />
        </div>
      </div>
    );
  }

  if (detail.error || !product) {
    return (
      <div className="container-page py-16">
        <div className="card">
          <EmptyState
            as="h1"
            title={[400, 404].includes(detail.error?.status) ? 'Product not found' : 'Could not load product'}
            description={[400, 404].includes(detail.error?.status) ? 'It may have been removed from the catalog.' : detail.error?.message}
            action={<Button to="/search">Browse products</Button>}
          />
        </div>
      </div>
    );
  }

  const savingsVsHighest = summary?.priceDifference > 0 ? summary.priceDifference : 0;
  const bestMrp = best?.mrp && best.mrp > best.currentPrice ? best.mrp : null;
  const vsAvg = stats?.averagePrice && summary?.lowestPrice ? summary.lowestPrice - stats.averagePrice : null;

  return (
    <div className="container-page py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-900">Home</Link>
        <ChevronRight className="size-4" />
        {product.category ? (
          <>
            <Link to={`/search?category=${encodeURIComponent(product.category)}`} className="hover:text-slate-900">
              {product.category}
            </Link>
            <ChevronRight className="size-4" />
          </>
        ) : null}
        <span className="max-w-[16rem] truncate text-slate-700">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <Gallery images={product.images || []} title={product.title} brand={product.brand} />

        <div className="min-w-0">
          {product.brand ? (
            <Link to={`/brands/${encodeURIComponent(product.brand)}`} className="text-xs font-semibold tracking-wider text-brand-600 uppercase hover:underline">
              {product.brand}
            </Link>
          ) : null}
          <h1 className="mt-2 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">{product.title}</h1>

          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
            {comparison.loading ? (
              <Skeleton className="h-16 w-full" />
            ) : summary?.lowestPrice ? (
              <>
                <p className="text-sm text-slate-500">Lowest price {best?.store?.name ? <>at <span className="font-semibold text-slate-700">{best.store.name}</span></> : null}</p>
                <div className="mt-1 flex flex-wrap items-baseline gap-3">
                  <span className="text-4xl font-extrabold tracking-tight">{formatInr(summary.lowestPrice)}</span>
                  {bestMrp ? (
                    <>
                      <span className="text-lg text-slate-400 line-through">{formatInr(bestMrp)}</span>
                      <Badge tone="green">{discountPct(bestMrp, summary.lowestPrice)}% off MRP</Badge>
                    </>
                  ) : null}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-500">Stores compared</p>
                    <p className="font-semibold">{summary.availableCount} of {summary.totalListings} in stock</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                    <p className="text-xs text-slate-500">You save vs. highest</p>
                    <p className="font-semibold text-emerald-700">{savingsVsHighest ? formatInr(savingsVsHighest) : '—'}</p>
                  </div>
                  <div className="col-span-2 rounded-xl bg-slate-50 px-3 py-2.5 sm:col-span-1">
                    <p className="text-xs text-slate-500">vs. {days}-day average</p>
                    <p className={cx('inline-flex items-center gap-1 font-semibold', vsAvg < 0 ? 'text-emerald-700' : vsAvg > 0 ? 'text-rose-600' : '')}>
                      {vsAvg == null ? '—' : vsAvg === 0 ? 'At average' : (
                        <>
                          {vsAvg < 0 ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}
                          {formatInr(Math.abs(vsAvg))}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No in-stock prices available right now.</p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {best ? (
                <Button href={best.affiliateUrl || best.productUrl} target="_blank" rel="noopener noreferrer" size="lg" className="flex-1 sm:flex-none">
                  Buy at {best.store?.name} <ExternalLink className="size-4" />
                </Button>
              ) : null}
              <Button variant={watched ? 'soft' : 'secondary'} size="lg" onClick={toggleWatch} loading={watchBusy}>
                <Heart className={cx('size-4', watched && 'fill-brand-600 text-brand-600')} />
                {watched ? 'Watching' : 'Watch'}
              </Button>
            </div>
          </div>

          <div id="alert" className="mt-6 scroll-mt-24">
            <AlertCard
              productId={id}
              summary={summary}
              stats={stats}
              listings={listings}
              myAlert={detail.data?.myAlert}
              onChanged={() => detail.reload({ silent: true })}
            />
          </div>
        </div>
      </div>

      {/* Comparison */}
      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Compare prices</h2>
            <p className="text-sm text-slate-500">Sorted by price · out-of-stock listings last</p>
          </div>
          {summary ? (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              {refreshQueued && Date.now() - openedAt < 6 * 60 * 1000 && (!summary.lastCheckedAt || Date.now() - new Date(summary.lastCheckedAt) > 5 * 60 * 1000) ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin text-brand-600" /> Refreshing prices…
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full bg-emerald-500" /> Checked {timeAgo(summary.lastCheckedAt)}
                  {summary.nextCheckAt && new Date(summary.nextCheckAt) > new Date() ? <> · next {timeAgo(summary.nextCheckAt)}</> : null}
                </>
              )}
            </p>
          ) : null}
        </div>
        <ErrorBanner error={comparison.error} onRetry={comparison.reload} />
        {comparison.loading ? (
          <Skeleton className="h-48 w-full" />
        ) : listings.length ? (
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {listings.map((row) => (
              <ListingRow key={row.storeProductId} row={row} best={summary?.lowestPrice} />
            ))}
          </div>
        ) : (
          <div className="card">
            <EmptyState title="No store listings yet" description="We haven't found this product in any tracked store." />
          </div>
        )}
      </section>

      {/* History */}
      <section className="mt-12">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Price history</h2>
            <p className="text-sm text-slate-500">Is today’s price actually a good deal?</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {listings.length > 1 ? (
              <select className="input h-9 w-auto pr-8" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} aria-label="Filter history by store">
                <option value="">All stores</option>
                {listings.map((l) => (
                  <option key={l.storeProductId} value={l.storeProductId}>
                    {l.store?.name}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {RANGES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={cx(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                    days === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {d < 365 ? `${d}d` : '1y'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="card p-4 sm:p-6">
            {history.loading ? (
              <Skeleton className="h-72 w-full" />
            ) : (history.data?.history?.length || 0) > 1 ? (
              <Suspense fallback={<Skeleton className="h-72 w-full" />}>
                <PriceChart history={history.data.history} />
              </Suspense>
            ) : (
              <EmptyState title="Not enough history yet" description="We’ll chart prices here as we record changes." className="py-16" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:content-start">
            {[
              ['Lowest', stats?.lowestHistoricalPrice, 'text-emerald-700'],
              ['Highest', stats?.highestHistoricalPrice, 'text-rose-600'],
              ['Average', stats?.averagePrice, ''],
              ['Price changes', stats?.dataPoints, '', true],
            ].map(([label, value, cls, raw]) => (
              <div key={label} className="card px-4 py-3">
                <p className="text-xs text-slate-500">{label} · {days < 365 ? `${days}d` : '1y'}</p>
                <p className={cx('mt-0.5 text-lg font-bold', cls)}>{raw ? (value ?? '—') : formatInr(value)}</p>
              </div>
            ))}
          </div>
        </div>

        {recent.length ? (
          <div className="card mt-4 divide-y divide-slate-100">
            {recent.map((h) => (
              <div key={h._id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-sm">
                <span className="w-36 text-slate-500 tabular-nums">{formatDate(h.recordedAt)}</span>
                <span className="w-24 font-medium">{h.storeId?.name || 'Store'}</span>
                <span className="text-slate-400 line-through tabular-nums">{h.previousPrice ? formatInr(h.previousPrice) : ''}</span>
                <span className="font-semibold tabular-nums">{formatInr(h.newPrice)}</span>
                <span className="ml-auto flex items-center gap-2">
                  {h.percentageChange ? (
                    <span className={cx('font-semibold tabular-nums', h.percentageChange < 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {h.percentageChange > 0 ? '+' : ''}
                      {h.percentageChange}%
                    </span>
                  ) : null}
                  <StatusBadge status={h.isHistoricalLow ? 'HISTORICAL_LOW' : h.changeType} />
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {similar.data.items.length ? (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold tracking-tight">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {similar.data.items.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {product.description ? (
        <section className="mt-12">
          <h2 className="mb-3 text-xl font-bold tracking-tight">About this product</h2>
          <div className="card p-6 text-sm leading-relaxed whitespace-pre-line text-slate-600">{product.description}</div>
        </section>
      ) : null}
    </div>
  );
}
