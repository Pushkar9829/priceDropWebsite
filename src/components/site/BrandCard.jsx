import { useState } from 'react';
import { Link } from 'react-router-dom';
import { brandLogo } from '../../lib/brands';
import { cx } from '../ui';

/** White logo plate: real site icon for known brands, otherwise a clean monogram. */
export function BrandLogo({ name, size = 'md', className }) {
  const [failed, setFailed] = useState(false);
  const src = brandLogo(name);
  const dims = size === 'lg' ? 'size-16 rounded-2xl text-2xl' : size === 'sm' ? 'size-10 rounded-xl text-base' : 'size-20 rounded-2xl text-3xl';
  return (
    <span className={cx('grid shrink-0 place-items-center overflow-hidden bg-[#ffffff] font-extrabold text-[#111315]', dims, className)}>
      {src && !failed ? (
        <img src={src} alt={`${name} logo`} loading="lazy" className="size-3/5 object-contain" onError={() => setFailed(true)} />
      ) : (
        (name || '?').slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

/**
 * Tall brand tile for category walls: logo plate on a dark card, name, category and live deals.
 */
export default function BrandCard({ brand }) {
  return (
    <Link
      to={`/brands/${encodeURIComponent(brand.name)}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200/30 bg-white/60 transition hover:-translate-y-0.5 hover:border-brand-300/60 hover:bg-white"
    >
      <div className="relative grid aspect-[4/5] place-items-center">
        {brand.maxDiscount > 0 ? (
          <span className="absolute top-3 left-3 rounded-md bg-brand-500 px-1.5 py-0.5 text-[11px] font-bold text-[#0f1a14]">
            Up to {brand.maxDiscount}% OFF
          </span>
        ) : null}
        <BrandLogo name={brand.name} className="transition group-hover:scale-105" />
      </div>
      <div className="px-4 pb-4">
        <p className="truncate font-semibold text-slate-900">{brand.name}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs">
          <span className="text-slate-500">{brand.category || 'Brand'}</span>
          {brand.dealCount ? (
            <span className="font-semibold text-brand-600">
              {brand.dealCount} deal{brand.dealCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
