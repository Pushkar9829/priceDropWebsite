import { Link } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import { formatInr } from '../../lib/format';

/**
 * Live price ticker — a marquee of discounted products that loops every 40s and
 * pauses while hovered. The list is rendered twice so the -50% loop is seamless.
 */
export default function PriceTicker({ items = [] }) {
  if (items.length < 3) return null;
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-b border-[#3e3f42]/50 bg-[#252627]/50 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[#181a1b] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[#181a1b] to-transparent" />
      <div className="dn-ticker flex w-max gap-6 px-4 py-3">
        {loop.map((item, i) => (
          <Link
            key={`${item.id}-${i}`}
            to={`/products/${item.id}`}
            aria-hidden={i >= items.length ? 'true' : undefined}
            tabIndex={i >= items.length ? -1 : undefined}
            className="group flex shrink-0 items-center gap-3 rounded-full border border-[#3e3f42]/50 bg-[#252627]/80 px-4 py-2 whitespace-nowrap transition-all duration-300 hover:border-[#2fda76]/50 hover:bg-[#252627]"
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2fda76]">
              <ArrowDown className="size-3.5" />
              {item.discount}%
            </span>
            {item.brand ? <span className="text-sm text-slate-500">{item.brand}</span> : null}
            <span className="text-sm font-medium text-slate-900 transition-colors group-hover:text-[#2fda76]">{formatInr(item.price)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
