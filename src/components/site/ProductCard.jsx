import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { ProductThumb } from '../ui';
import { discountPct, formatInr, idOf, productImage } from '../../lib/format';

/**
 * Catalog product card (search result shape: lowestPrice/highestPrice/mrp/storeCount).
 * droppingnow tile: bordered card that lifts 2px on hover while the image zooms 5%.
 */
export default function ProductCard({ product }) {
  const id = idOf(product);
  const price = product.lowestPrice ?? product.currentPrice;
  const was = price != null && product.mrp && product.mrp > price ? product.mrp : null;
  const pct = product.discountPercent ?? discountPct(was, price);
  const spread = product.highestPrice && price && product.highestPrice > price ? product.highestPrice - price : 0;

  return (
    <Link to={`/products/${id}`} className="group dn-card">
      <div className="relative aspect-square overflow-hidden bg-[#ffffff]/[0.03]">
        <ProductThumb src={productImage(product.images)} alt={product.title} fallback={product.brand} className="size-full bg-transparent" />
        {pct ? <span className="dn-pill absolute top-2.5 left-2.5 px-2 py-0.5 text-xs">{pct}% OFF</span> : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {product.brand ? <p className="mb-0.5 truncate text-xs font-semibold tracking-wide text-brand-600 uppercase">{product.brand}</p> : null}
        <h3 className="mb-2 line-clamp-2 min-h-[2.25rem] text-sm leading-tight font-medium text-slate-900">{product.title}</h3>
        <div className="mt-auto">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base font-bold text-slate-900">{formatInr(price)}</span>
            {was ? <span className="text-xs text-slate-500 line-through">{formatInr(was)}</span> : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Store className="size-3.5" />
              {product.storeCount ? `${product.storeCount} store${product.storeCount === 1 ? '' : 's'}` : 'No listings'}
            </span>
            {spread > 0 ? <span className="font-medium whitespace-nowrap text-brand-600">Save {formatInr(spread)}</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/40 bg-white">
      <div className="skeleton aspect-square rounded-none" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton mt-3 h-5 w-20" />
      </div>
    </div>
  );
}
