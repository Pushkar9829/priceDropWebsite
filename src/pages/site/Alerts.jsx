import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, Check, Pencil, Trash2, X } from 'lucide-react';
import { Button, EmptyState, ErrorBanner, ProductThumb, Skeleton, StatusBadge, Toggle, cx } from '../../components/ui';
import { alertApi, notifyInboxChanged } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { formatInr, idOf, productImage, timeAgo } from '../../lib/format';
import { PageHeader } from './Watchlist';

function AlertRow({ alert, onChange, onRemove }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState(String(alert.targetPrice));
  const [busy, setBusy] = useState(false);
  const product = alert.productId || {};
  const pid = idOf(product);
  const reached = alert.currentPrice != null && alert.currentPrice <= alert.targetPrice;
  const gap = alert.currentPrice != null ? alert.currentPrice - alert.targetPrice : null;
  const progress =
    alert.currentPrice && alert.targetPrice ? Math.min(100, Math.round((alert.targetPrice / alert.currentPrice) * 100)) : 0;

  const run = async (fn, msg) => {
    setBusy(true);
    try {
      const updated = await fn();
      // PATCH returns unpopulated refs — keep the populated product/store for display
      if (updated?.status === 'TRIGGERED') notifyInboxChanged();
      if (updated) onChange({ ...alert, ...updated, productId: alert.productId, storeProductId: alert.storeProductId });
      if (msg) toast.success(msg);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Link to={`/products/${pid}`} className="shrink-0">
          <ProductThumb src={productImage(product.images)} alt={product.title} className="size-16 rounded-xl border border-slate-100 [&_img]:p-1.5" compact />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/products/${pid}`} className="line-clamp-1 font-semibold hover:text-brand-700">
            {product.title || 'Product'}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <StatusBadge status={alert.status} />
            <span>{alert.storeProductId ? `Only ${alert.storeProductId.storeId?.name || 'one store'}` : 'Any store'}</span>
            {reached && alert.status !== 'PAUSED' ? <span className="font-medium text-emerald-600">· target reached</span> : null}
            {alert.lastNotifiedAt ? <span>· notified {timeAgo(alert.lastNotifiedAt)}</span> : null}
          </div>
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div className={cx('h-full rounded-full', reached ? 'bg-emerald-500' : 'bg-brand-500')} style={{ width: `${reached ? 100 : progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-sm">
          <p className="text-xs text-slate-500">Now → Target</p>
          {editing ? (
            <form
              className="mt-0.5 flex items-center gap-1"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await run(() => alertApi.update(alert._id, { targetPrice: Number(target) }), 'Target updated')) setEditing(false);
              }}
            >
              <input type="number" min="1" className="input h-8 w-28" value={target} onChange={(e) => setTarget(e.target.value)} autoFocus aria-label="New target price" />
              <Button size="icon" variant="soft" type="submit" className="size-8" aria-label="Save">
                <Check className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => {
                  setTarget(String(alert.targetPrice));
                  setEditing(false);
                }}
                aria-label="Cancel"
              >
                <X className="size-4" />
              </Button>
            </form>
          ) : (
            <p className="font-semibold tabular-nums">
              {formatInr(alert.currentPrice)} → <span className="text-brand-700">{formatInr(alert.targetPrice)}</span>
              {gap > 0 ? <span className="ml-2 text-xs font-normal whitespace-nowrap text-slate-500">{formatInr(gap)} to go</span> : null}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Toggle
            label={alert.status === 'PAUSED' ? 'Resume alert' : 'Pause alert'}
            checked={alert.status !== 'PAUSED'}
            disabled={busy}
            onChange={(on) => run(() => alertApi.update(alert._id, { status: on ? 'ACTIVE' : 'PAUSED' }))}
          />
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit target">
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Delete alert"
            onClick={async () => {
              if (await run(() => alertApi.remove(alert._id), 'Alert deleted')) onRemove(alert._id);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Alerts() {
  useDocumentTitle('Price alerts');
  const list = useAsync(() => alertApi.list(), [], { initial: { items: [] } });
  const items = list.data.items;

  return (
    <div className="container-page max-w-4xl py-8">
      <PageHeader title="Price alerts" description="Products with an alert are re-checked every 30 minutes — we notify you the moment a target is hit." />
      <ErrorBanner error={list.error} onRetry={list.reload} />
      {list.loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : items.length ? (
        <div className="card divide-y divide-slate-100">
          {items.map((a) => (
            <AlertRow
              key={a._id}
              alert={a}
              onChange={(next) => list.setData((d) => ({ ...d, items: d.items.map((x) => (x._id === next._id ? next : x)) }))}
              onRemove={(id) => list.setData((d) => ({ ...d, items: d.items.filter((x) => x._id !== id) }))}
            />
          ))}
        </div>
      ) : !list.error ? (
        <div className="card">
          <EmptyState
            icon={BellRing}
            title="No price alerts yet"
            description="Open any product and set a target price to get notified."
            action={<Button to="/search">Find a product</Button>}
          />
        </div>
      ) : null}
    </div>
  );
}
