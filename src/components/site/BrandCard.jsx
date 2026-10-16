import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Percent, Star } from 'lucide-react';
import { brandLogo } from '../../lib/brands';
import { cx } from '../ui';

const SIZES = {
  sm: 'size-10 rounded-xl text-base',
  md: 'size-20 rounded-2xl text-3xl',
  lg: 'size-16 rounded-2xl text-2xl',
  // Scales with its card: ~46% of the card width, square, rounded like an app icon
  fluid: 'aspect-square w-[46%] rounded-[18%] text-[clamp(1.5rem,4vw,2.5rem)]',
};

/** White logo plate: real site icon for known brands, otherwise a clean monogram. */
export function BrandLogo({ name, size = 'md', className }) {
  const [failed, setFailed] = useState(false);
  const src = brandLogo(name);
  return (
    <span className={cx('grid shrink-0 place-items-center overflow-hidden bg-[#ffffff] font-extrabold text-[#111315]', SIZES[size] || SIZES.md, className)}>
      {src && !failed ? (
        <img src={src} alt={`${name} logo`} loading="lazy" className="size-3/5 object-contain" onError={() => setFailed(true)} />
      ) : (
        (name || '?').slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

/**
 * Brand tile for the category walls: shaded top with the best-discount pill (and a star on
 * popular brands), a large white logo tile, then a footer band with name, category and deals.
 */
export default function BrandCard({ brand, featured = false }) {
  const deals = brand.dealCount || 0;
  return (
    <Link to={`/brands/${encodeURIComponent(brand.name)}`} className="group dn-brand-card h-full rounded-2xl">
      <div className="relative grid aspect-[4/5] place-items-center bg-gradient-to-b from-[#2c2e30] to-[#1c1e1f]">
        {brand.maxDiscount > 0 ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#1fae5b] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#ffffff] shadow-sm sm:text-xs">
            <Percent className="size-3" strokeWidth={3} /> {brand.maxDiscount}% OFF
          </span>
        ) : null}
        {featured ? (
          <span className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-[#3ccf7a] text-[#ffffff] shadow-sm" title="Popular brand">
            <Star className="size-3.5 fill-current" />
            <span className="sr-only">Popular brand</span>
          </span>
        ) : null}
        <BrandLogo name={brand.name} size="fluid" className="shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className="border-t border-white/5 bg-[#232526] px-4 py-3.5">
        <p className="truncate text-[15px] font-semibold text-slate-900 sm:text-base">{brand.name}</p>
        <p className="mt-1 truncate text-[13px] text-slate-500">
          {brand.category || 'Brand'}
          {deals ? (
            <>
              <span className="mx-1.5">·</span>
              <span className="font-medium text-[#2fda76]">
                {deals} deal{deals === 1 ? '' : 's'}
              </span>
            </>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
