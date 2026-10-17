import { TrendingDown } from 'lucide-react';
import { cx } from '../ui';

/** droppingnow mark: green circle with a black "trending down" arrow (same art as /favicon.svg). */
export default function BrandMark({ className = 'size-7', iconClassName = 'size-3.5' }) {
  return (
    <span className={cx('flex shrink-0 items-center justify-center rounded-full bg-[#2fda76]', className)}>
      <TrendingDown className={cx('text-black', iconClassName)} strokeWidth={2} aria-hidden />
    </span>
  );
}
