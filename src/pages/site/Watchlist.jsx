import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { Button, EmptyState, ErrorBanner, ProductThumb, Skeleton, staggerStyle } from '../../components/ui';
import { watchlistApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { formatInr, productImage, timeAgo } from '../../lib/format';

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="dn-enter dn-d1 text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export default function Watchlist() {
  useDocumentTitle('Watchlist');
  const toast = useToast();
  const list = useAsync(() => watchlistApi.list(), [], { initial: { items: [] } });
  const [busy, setBusy] = useState('');

  const remove = async (productId) => {
    setBusy(productId);
    try {
      await watchlistApi.remove(productId);
      list.setData((d) => ({ ...d, items: d.items.filter((i) => i.product.id !== productId) }));
      toast.info('Removed from watchlist');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const items = list.data.items;
  return (
    <div className="container-page max-w-4xl py-8">
      <PageHeader title="Watchlist" description="Products you're keeping an eye on, with today's lowest price." />
      <ErrorBanner error={list.error} onRetry={list.reload} />
      {list.loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : items.length ? (
        <div className="card divide-y divide-slate-100">
          {items.map(({ id, addedAt, addedPrice, priceChange, product }, i) => (
            <div key={id} className="dn-stagger flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4" style={staggerStyle(i)}>
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <Link to={`/products/${product.id}`} className="shrink-0">
                  <ProductThumb src={productImage(product.images)} alt={product.title} className="size-20 rounded-xl border border-slate-100 [&_img]:p-2" compact />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{product.brand}</p>
                  <Link to={`/products/${product.id}`} className="line-clamp-2 font-semibold hover:text-brand-700">
                    {product.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.storeCount} store{product.storeCount === 1 ? '' : 's'} · added {timeAgo(addedAt)}
                  </p>
                </div>
              </div>
              {/* Price + actions share one row on phones (indented under the title), sit inline on desktop */}
              <div className="flex items-center gap-2 pl-24 sm:pl-0">
                <div className="mr-auto sm:mr-3 sm:text-right">
                  <p className="text-xs text-slate-500">Lowest now</p>
                  <p className="text-lg font-bold">{formatInr(product.lowestPrice)}</p>
                  {priceChange ? (
                    <p className={`text-xs font-semibold ${priceChange < 0 ? 'text-emerald-600' : 'text-rose-600'}`} title={`Saved at ${formatInr(addedPrice)}`}>
                      {priceChange < 0 ? '↓' : '↑'} {formatInr(Math.abs(priceChange))} since saved
                    </p>
                  ) : null}
                </div>
                <Button variant="secondary" size="sm" to={`/products/${product.id}#alert`}>
                  Set alert
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(product.id)} loading={busy === product.id} aria-label={`Remove ${product.title} from watchlist`}>
                  {busy === product.id ? null : <Trash2 className="size-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : !list.error ? (
        <div className="card">
          <EmptyState
            icon={Heart}
            title="Your watchlist is empty"
            description="Tap “Watch” on any product to track it here."
            action={<Button to="/search">Find products</Button>}
          />
        </div>
      ) : null}
    </div>
  );
}
