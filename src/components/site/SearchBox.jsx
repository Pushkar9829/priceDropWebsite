import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { cx } from '../ui';

export default function SearchBox({ size = 'md', autoFocus = false, className, placeholder }) {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const navigate = useNavigate();

  useEffect(() => {
    setQ(params.get('q') || '');
  }, [params]);

  const submit = (e) => {
    e.preventDefault();
    const query = q.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  };

  const large = size === 'lg';
  return (
    <form onSubmit={submit} className={cx('relative w-full', className)} role="search">
      <Search
        className={cx(
          'pointer-events-none absolute top-1/2 -translate-y-1/2',
          large ? 'left-4 size-5 text-brand-500' : 'left-3.5 size-4 text-slate-500'
        )}
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder={placeholder || (large ? 'Search a product or brand, e.g. iPhone, Nike, Samsung TV…' : 'Search deals…')}
        aria-label="Search products"
        className={cx(
          'w-full border text-slate-900 transition placeholder:text-slate-500 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none',
          large
            ? 'h-14 rounded-xl border-slate-200/70 bg-slate-100/60 pr-4 pl-12 text-[15px]'
            : 'h-10 rounded-full border-slate-200/60 bg-slate-100/50 pr-4 pl-10 text-sm'
        )}
      />
    </form>
  );
}
