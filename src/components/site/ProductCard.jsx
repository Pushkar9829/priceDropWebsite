import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { ProductThumb } from '../ui';
import { discountPct, formatInr, idOf, productImage } from '../../lib/format';

/**
 * Catalog product card (search result shape: lowestPrice/highestPrice/mrp/storeCount).
 * Dark card with a white image plate.
 */
export default function ProductCard({ product }) {
  const id = idOf(product);
  const price = product.lowestPrice ?? product.currentPrice;
  const was = price != null && product.mrp && product.mrp > price ? product.mrp : null;
  const pct = product.discountPercent ?? discountPct(was, price);
  const spread = product.highestPrice && price && product.highestPrice > price ? product.highestPrice - price : 0;

  return (
    <Link
      to={`/products/${id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/40 bg-white/60 p-3 transition hover:-translate-y-0.5 hover:border-brand-300/60 hover:bg-white"
    >
      <div className="relative">
        <ProductThumb tone="light" src={productImage(product.images)} alt={product.title} fallback={product.brand} className="aspect-square rounded-lg" />
        {pct ? (
          <span className="absolute top-2 left-2 rounded-md bg-brand-500 px-1.5 py-0.5 text-[11px] font-bold text-[#0f1a14]">
            {pct}% OFF
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        {product.brand ? <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{product.brand}</p> : null}
        <h3 className="mt-1 line-clamp-2 text-sm leading-snug font-semibold text-slate-900 group-hover:text-brand-700">{product.title}</h3>
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-bold text-slate-900">{formatInr(price)}</span>
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
    <div className="rounded-xl border border-slate-200/40 bg-white/60 p-3">
      <div className="skeleton aspect-square rounded-lg" />
      <div className="space-y-2 px-1 pt-3">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton mt-3 h-6 w-24" />
      </div>
    </div>
  );
}
