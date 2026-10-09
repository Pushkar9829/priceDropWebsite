import { Link } from 'react-router-dom';
import { ProductThumb, StoreLogo } from '../ui';
import { formatInr, idOf, productImage, timeAgo } from '../../lib/format';

/** Price-drop tile — same card language as ProductCard (lift + image zoom on hover). */
export default function DealCard({ deal }) {
  const product = deal.productId || {};
  const pid = idOf(product);
  const pct = deal.discountPercent != null ? Math.round(deal.discountPercent) : null;
  const saved = deal.previousPrice && deal.currentPrice ? deal.previousPrice - deal.currentPrice : null;

  return (
    <Link to={pid ? `/products/${pid}` : '/deals'} className="group dn-card">
      <div className="relative aspect-square overflow-hidden bg-[#ffffff]/[0.03]">
        <ProductThumb src={productImage(product.images)} alt={product.title} fallback={product.brand} className="size-full bg-transparent" />
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {pct ? <span className="dn-pill px-2 py-0.5 text-xs">{pct}% OFF</span> : null}
          {deal.isHistoricalLow ? <span className="dn-pill dn-pill-new px-2 py-0.5 text-xs">LOWEST EVER</span> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        {product.brand ? <p className="mb-0.5 truncate text-xs font-semibold tracking-wide text-brand-600 uppercase">{product.brand}</p> : null}
        <h3 className="mb-2 line-clamp-2 min-h-[2.25rem] text-sm leading-tight font-medium text-slate-900">{product.title || deal.title}</h3>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
          <span className="text-base font-bold">{formatInr(deal.currentPrice)}</span>
          {deal.previousPrice ? <span className="text-xs text-slate-500 line-through">{formatInr(deal.previousPrice)}</span> : null}
          {saved > 0 ? <span className="ml-auto text-xs font-semibold text-brand-600">−{formatInr(saved)}</span> : null}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <StoreLogo store={deal.storeId} size="sm" />
          <span className="truncate">{deal.storeId?.name || 'Store'}</span>
          <span className="ml-auto shrink-0">{timeAgo(deal.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
