import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BellRing,
  Clock,
  ExternalLink,
  Heart,
  RefreshCw,
  Star,
  Store,
  Trophy,
} from 'lucide-react';
import { Badge, Button, EmptyState, ErrorBanner, ProductThumb, Skeleton, StatusBadge, StoreLogo, cx, staggerStyle } from '../../components/ui';
import { alertApi, notifyInboxChanged, productApi, watchlistApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { discountPct, formatDate, formatInr, productImage, timeAgo } from '../../lib/format';

const PriceChart = lazy(() => import('../../components/site/PriceChart'));
const RANGES = [30, 90, 180, 365];

function Gallery({ images = [], title, brand, offPct, isNew }) {
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [images]);
  return (
    <div className="relative w-full min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-3xl border border-white/5 bg-[#252627]">
        <ProductThumb src={images[active]} alt={title} fallback={brand} className="size-full bg-transparent [&_img]:p-0" />
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
          {offPct ? (
            <span className="rounded-full bg-[#163b26] px-3 py-1.5 text-sm font-bold text-[#2fda76]">{offPct}% OFF</span>
          ) : null}
          {isNew ? <span className="rounded-full bg-[#300845] px-3 py-1.5 text-sm font-bold text-[#be5eed]">NEW</span> : null}
        </div>
      </div>
      {images.length > 1 ? (
        <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
          {images.slice(0, 8).map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Image ${i + 1}`}
              className={cx(
                'size-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#252627] p-1 transition',
                i === active ? 'border-[#2fda76]' : 'border-white/10 hover:border-white/25'
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

/** "More from {brand}" tile: square image, % OFF pill, brand label, title, price. */
function MiniProductCard({ product }) {
  const pct = product.discountPercent;
  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-white/[0.04]">
        <ProductThumb
          src={productImage(product.images)}
          alt={product.title}
          fallback={product.brand}
          className="size-full bg-transparent transition-transform duration-500 group-hover:scale-105 [&_img]:p-2"
        />
        {pct ? (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-[#163b26] px-2.5 py-0.5 text-xs font-bold text-[#2fda76]">{pct}% OFF</span>
        ) : null}
      </div>
      {product.brand ? <p className="mt-3 text-xs font-bold tracking-wider text-[#2fda76] uppercase">{product.brand}</p> : null}
      <p className="mt-1 line-clamp-2 text-sm leading-snug font-medium text-slate-900 group-hover:text-[#2fda76]">{product.title}</p>
      <p className="mt-1.5 text-base font-bold">{formatInr(product.lowestPrice)}</p>
    </Link>
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
      <nav className="flex min-w-0 items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="dn-link shrink-0">Home</Link>
        <span>/</span>
        {product.brand ? (
          <>
            <Link to={`/brands/${encodeURIComponent(product.brand)}`} className="dn-link shrink-0">{product.brand}</Link>
            <span>/</span>
          </>
        ) : null}
        <span className="truncate text-slate-800">{product.title}</span>
      </nav>

      <button
        type="button"
        onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/'))}
        className="dn-link mt-6 inline-flex items-center gap-2 text-base text-slate-500"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery
          images={product.images || []}
          title={product.title}
          brand={product.brand}
          offPct={bestMrp ? discountPct(bestMrp, summary?.lowestPrice) : null}
          isNew={Boolean(product.createdAt) && Date.now() - new Date(product.createdAt) < 7 * 24 * 3600 * 1000}
        />

        <div className="flex w-full min-w-0 flex-col">
          {product.brand ? (
            <Link to={`/brands/${encodeURIComponent(product.brand)}`} className="mb-2 text-sm font-bold tracking-wider text-[#2fda76] uppercase hover:underline">
              {product.brand}
            </Link>
          ) : null}
          <h1 className="dn-enter dn-d1 mb-6 text-2xl leading-tight font-bold sm:text-3xl">{product.title}</h1>

          {comparison.loading ? (
            <Skeleton className="mb-4 h-24 w-full rounded-2xl" />
          ) : summary?.lowestPrice ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-[#2fda76]/40 bg-gradient-to-r from-[#2fda76]/10 via-[#2fda76]/5 to-transparent p-4 sm:gap-4">
              <div className="flex flex-col">
                <span className="mb-1 text-xs font-semibold tracking-wide text-[#2fda76] uppercase">Today&apos;s price</span>
                <span className="text-3xl font-extrabold sm:text-4xl">{formatInr(summary.lowestPrice)}</span>
              </div>
              {bestMrp ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm text-slate-500">
                    M.R.P: <span className="line-through">{formatInr(bestMrp)}</span>
                  </span>
                  <span className="w-fit rounded-full bg-[#163b26] px-2.5 py-1 text-sm font-bold text-[#2fda76]">
                    Save {formatInr(bestMrp - summary.lowestPrice)}
                  </span>
                </div>
              ) : null}
              {summary.totalListings > 1 && savingsVsHighest ? (
                <span className="text-sm text-slate-500 sm:ml-auto">
                  {formatInr(savingsVsHighest)} cheaper than the priciest of {summary.totalListings} stores
                </span>
              ) : null}
            </div>
          ) : (
            <div className="mb-4 rounded-2xl border-2 border-white/10 p-4 text-sm text-slate-500">No in-stock price available right now.</div>
          )}

          {best ? (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/5 bg-[#252627] p-3 sm:p-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#163b26] text-[#2fda76]">
                <Store className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-500">Available at</div>
                <div className="truncate text-base font-semibold sm:text-lg">{best.store?.name}</div>
              </div>
              <div className="shrink-0 text-right text-sm">
                <div className="text-slate-500">Price verified</div>
                <div className="text-slate-800">{best.lastCheckedAt ? new Date(best.lastCheckedAt).toLocaleDateString('en-IN') : '—'}</div>
              </div>
            </div>
          ) : null}

          {product.description ? (
            <p className="mb-6 line-clamp-5 text-base leading-relaxed text-slate-500">{product.description}</p>
          ) : null}

          {best ? (
            <>
              <a
                href={best.affiliateUrl || best.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#22bf63] to-[#49df87] px-10 text-lg font-semibold text-[#ffffff] shadow-lg shadow-[#2fda76]/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-[#2fda76]/50 active:scale-[0.98]"
              >
                <span className="truncate">Get this deal on {best.store?.name}</span>
                <ExternalLink className="size-4 shrink-0" />
              </a>
              <div className="mt-4 rounded-lg bg-white/[0.06] p-3 text-sm text-slate-600">
                Opens {best.store?.name} in a new tab to complete your purchase. Prices and stock can change at any time, and we may earn a
                commission from qualifying purchases.
              </div>
            </>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant={watched ? 'soft' : 'secondary'} onClick={toggleWatch} loading={watchBusy} className="rounded-full">
              <Heart className={cx('size-4', watched && 'fill-current')} />
              {watched ? 'Watching' : 'Watch'}
            </Button>
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => document.getElementById('alert')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <BellRing className="size-4" />
              {detail.data?.myAlert ? 'Your alert' : 'Price alert'}
            </Button>
          </div>
        </div>
      </div>

      <section id="alert" className="mt-12 max-w-2xl scroll-mt-24">
        <AlertCard
          productId={id}
          summary={summary}
          stats={stats}
          listings={listings}
          myAlert={detail.data?.myAlert}
          onChanged={() => detail.reload({ silent: true })}
        />
      </section>

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
                    'dn-chip',
                    days === d && 'active'
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
        <section className="mt-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">{product.brand ? `More from ${product.brand}` : 'You may also like'}</h2>
            {product.brand ? (
              <Link to={`/brands/${encodeURIComponent(product.brand)}`} className="text-xs font-semibold text-brand-600 hover:underline">
                View all
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {similar.data.items.slice(0, 10).map((p, i) => (
              <div key={p.id} className="dn-stagger" style={staggerStyle(i)}>
                <MiniProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
