import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { alertApi, productApi, watchlistApi } from '../api/shop';
import { useAuth } from '../context/AuthContext';
import { formatInr, productImage } from '../utils/format';

export default function Product() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [history, setHistory] = useState(null);
  const [storeFilter, setStoreFilter] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setComparison(null);
    setHistory(null);

    (async () => {
      try {
        const detail = await productApi.get(id);
        if (cancelled) return;
        setProduct(detail.product);

        const compResult = await Promise.allSettled([productApi.comparison(id)]);
        if (cancelled) return;

        if (compResult[0].status === 'fulfilled') {
          setComparison(compResult[0].value);
          const lowest = compResult[0].value?.summary?.lowestPrice;
          if (lowest) setTargetPrice(String(Math.floor(lowest * 0.95)));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    productApi
      .priceHistory(id, storeFilter ? { storeProductId: storeFilter } : {})
      .then((hist) => {
        if (!cancelled) setHistory(hist);
      })
      .catch(() => {
        if (!cancelled) setHistory(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, storeFilter]);

  const img = productImage(product?.images);
  const summary = comparison?.summary;
  const listings = comparison?.listings || [];

  const historyPoints = useMemo(() => {
    const rows = history?.history || [];
    return rows.slice(-40);
  }, [history]);

  const onWatch = async () => {
    if (!isAuthenticated) {
      setMessage('Log in to save this product to your watchlist.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await watchlistApi.add(id);
      setWatching(true);
      setMessage('Saved to watchlist.');
    } catch (err) {
      setMessage(err.message || 'Could not update watchlist');
    } finally {
      setBusy(false);
    }
  };

  const onAlert = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setMessage('Log in to set a price alert.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await alertApi.create({
        productId: id,
        targetPrice: Number(targetPrice),
        ...(storeFilter ? { storeProductId: storeFilter } : {}),
      });
      setMessage(`Alert set at ${formatInr(targetPrice)}.`);
    } catch (err) {
      setMessage(err.message || 'Could not create alert');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-10">
        <div className="skeleton h-80" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container space-y-4 py-10">
        <div className="error-banner">{error || 'Product not found'}</div>
        <Link to="/search?q=iphone" className="btn btn-soft">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="container space-y-12 py-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <motion.div
          className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-line bg-elevated"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {img ? (
            <img src={img} alt={product.title} className="h-full w-full object-contain p-8" />
          ) : (
            <div className="font-display text-6xl text-ink-faint">
              {product.brand?.slice(0, 1) || 'P'}
            </div>
          )}
        </motion.div>

        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-ink-muted">
            {product.brand}
          </p>
          <h1 className="mt-2 text-[clamp(1.5rem,3vw,2.25rem)]">{product.title}</h1>
          <p className="mt-4 flex flex-wrap items-center gap-3">
            <span className="price text-3xl">{formatInr(summary?.lowestPrice)}</span>
            {summary?.bestStore ? (
              <span className="badge badge-best">Best at {summary.bestStore.name}</span>
            ) : null}
          </p>
          {summary?.priceDifference > 0 ? (
            <p className="muted mt-2 text-sm">
              Spread across stores: {formatInr(summary.priceDifference)} (
              {summary.percentageDifference}%)
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-soft"
              onClick={onWatch}
              disabled={busy || watching}
            >
              {watching ? 'Watching' : 'Watch'}
            </button>
            {!isAuthenticated ? (
              <Link to="/login" className="btn btn-ghost">
                Log in for alerts
              </Link>
            ) : (
              <Link to="/alerts" className="btn btn-ghost">
                My alerts
              </Link>
            )}
          </div>

          <form className="mt-8 max-w-md space-y-3" onSubmit={onAlert}>
            <label className="label" htmlFor="target">
              Alert me when price ≤
            </label>
            <div className="flex gap-2">
              <input
                id="target"
                className="field"
                type="number"
                min="0"
                step="1"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                required
              />
              <button className="btn btn-primary shrink-0" type="submit" disabled={busy}>
                Set alert
              </button>
            </div>
          </form>

          {message ? <p className="mt-4 text-sm text-teal">{message}</p> : null}
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-xl">Store comparison</h2>
        {!listings.length ? (
          <div className="empty">
            <p>No store listings yet for this product.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-line bg-elevated">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-semibold">Store</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Availability</th>
                  <th className="px-4 py-3 font-semibold">Checked</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {listings.map((row) => (
                  <tr
                    key={row.storeProductId}
                    className={`border-b border-line last:border-0 ${
                      row.isBestPrice ? 'bg-teal-wash/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{row.store?.name || 'Store'}</strong>
                        {row.isBestPrice ? <span className="badge badge-best">Lowest</span> : null}
                      </div>
                      {row.seller ? <p className="muted text-xs">{row.seller}</p> : null}
                    </td>
                    <td className="price px-4 py-3">{formatInr(row.currentPrice)}</td>
                    <td className="muted px-4 py-3">
                      {row.availability?.replaceAll('_', ' ') || '—'}
                    </td>
                    <td className="muted px-4 py-3 tabular-nums">
                      {row.lastCheckedAt
                        ? new Date(row.lastCheckedAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        className="btn btn-ghost"
                        href={row.affiliateUrl || row.productUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Visit
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl">Recent price moves</h2>
          {listings.length ? (
            <select
              className="field max-w-xs"
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
            >
              <option value="">All stores</option>
              {listings.map((row) => (
                <option key={row.storeProductId} value={row.storeProductId}>
                  {row.store?.name || 'Store'}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {!historyPoints.length ? (
          <div className="empty">
            <p>No price history recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-line rounded-md border border-line bg-elevated">
            {historyPoints
              .slice()
              .reverse()
              .slice(0, 12)
              .map((h) => (
                <div
                  key={h._id || `${h.recordedAt}-${h.newPrice}`}
                  className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-3 px-4 py-3 text-sm"
                >
                  <span className="muted tabular-nums">
                    {new Date(h.recordedAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>{h.storeId?.name || 'Store'}</span>
                  <span className="price">{formatInr(h.newPrice)}</span>
                  {h.changeType ? (
                    <span
                      className={
                        h.changeType === 'DECREASE' ? 'badge badge-drop' : 'badge'
                      }
                    >
                      {h.changeType}
                    </span>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
          </div>
        )}

        {history?.stats ? (
          <p className="muted mt-3 text-sm">
            {history.stats.days}d range · low {formatInr(history.stats.lowestHistoricalPrice)} ·
            high {formatInr(history.stats.highestHistoricalPrice)} · avg{' '}
            {formatInr(history.stats.averagePrice)}
          </p>
        ) : null}
      </section>
    </div>
  );
}
