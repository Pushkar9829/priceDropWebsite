import { Link } from 'react-router-dom';
import { TrendingDown } from 'lucide-react';
import { ProductThumb, StoreLogo } from '../ui';
import { formatInr, idOf, productImage, timeAgo } from '../../lib/format';

export default function DealCard({ deal }) {
  const product = deal.productId || {};
  const pid = idOf(product);
  const pct = deal.discountPercent != null ? Math.round(deal.discountPercent) : null;
  const saved = deal.previousPrice && deal.currentPrice ? deal.previousPrice - deal.currentPrice : null;

  return (
    <Link
      to={pid ? `/products/${pid}` : '/deals'}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/40 bg-white/60 p-3 transition hover:-translate-y-0.5 hover:border-brand-300/60 hover:bg-white"
    >
      <div className="relative">
        <ProductThumb tone="light" src={productImage(product.images)} alt={product.title} fallback={product.brand} className="aspect-[4/3] rounded-lg" />
        {pct ? (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-brand-500 px-1.5 py-0.5 text-[11px] font-bold text-[#0f1a14]">
            <TrendingDown className="size-3" /> {pct}% OFF
          </span>
        ) : null}
        {deal.isHistoricalLow ? (
          <span className="absolute top-2 right-2 rounded-md bg-[#0f1a14]/80 px-1.5 py-0.5 text-[11px] font-semibold text-[#5ad99b]">Lowest ever</span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <StoreLogo store={deal.storeId} size="sm" />
          <span className="truncate font-medium text-slate-700">{deal.storeId?.name || 'Store'}</span>
          <span className="ml-auto shrink-0">{timeAgo(deal.createdAt)}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-sm leading-snug font-semibold text-slate-900 group-hover:text-brand-700">
          {product.title || deal.title}
        </h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-3">
          <span className="text-lg font-bold">{formatInr(deal.currentPrice)}</span>
          {deal.previousPrice ? <span className="text-xs text-slate-500 line-through">{formatInr(deal.previousPrice)}</span> : null}
          {saved > 0 ? <span className="ml-auto text-xs font-semibold text-brand-600">−{formatInr(saved)}</span> : null}
        </div>
      </div>
    </Link>
  );
}
