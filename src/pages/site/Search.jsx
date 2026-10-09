import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchX, X } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../../components/site/ProductCard';
import { Button, EmptyState, ErrorBanner, Pagination, cx } from '../../components/ui';
import { productApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';

const SORTS = [
  ['relevance', 'Best match'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['newest', 'Newest'],
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const brand = params.get('brand') || '';
  // Sanitize URL params (hand-edited / stale links) so they can't 400 the API or show ₹NaN
  const rawSort = params.get('sort');
  const sort = SORTS.some(([v]) => v === rawSort) ? rawSort : 'relevance';
  const page = Math.min(500, Math.max(1, parseInt(params.get('page'), 10) || 1));
  const cleanPrice = (v) => (Number(v) > 0 ? String(Math.round(Number(v))) : '');
  const minPrice = cleanPrice(params.get('minPrice'));
  const maxPrice = cleanPrice(params.get('maxPrice'));
  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice });
  useEffect(() => setPriceDraft({ min: minPrice, max: maxPrice }), [minPrice, maxPrice]);

  useDocumentTitle(q ? `“${q}”` : brand || category || 'Browse');

  const results = useAsync(
    () => productApi.search({ q, category, brand, sort, page, limit: 24, minPrice, maxPrice }),
    [q, category, brand, sort, page, minPrice, maxPrice],
    {
      initial: { items: [], total: 0, page: 1, pages: 1 },
    }
  );
  const allCategories = useAsync(() => productApi.categories(), [], { initial: { items: [] } });
  // Counts follow the current query/brand/price (server facets); fall back to the catalog list
  const categoryList = results.data.facets?.categories || allCategories.data.items;
  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
    if ('page' in patch) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { items, total, pages } = results.data;
  const heading = q ? `Results for “${q}”` : brand ? brand : category ? category : 'All products';
  const activeFilters = [
    category && [['category'], `Category: ${category}`],
    brand && [['brand'], `Brand: ${brand}`],
    (minPrice || maxPrice) && [
      ['minPrice', 'maxPrice'],
      minPrice && maxPrice ? `${fmt(minPrice)} – ${fmt(maxPrice)}` : minPrice ? `Over ${fmt(minPrice)}` : `Under ${fmt(maxPrice)}`,
    ],
  ].filter(Boolean);
  const applyPrice = (e) => {
    e.preventDefault();
    const min = Number(priceDraft.min) || '';
    const max = Number(priceDraft.max) || '';
    // Swap if entered backwards
    update(min && max && min > max ? { minPrice: String(max), maxPrice: String(min) } : { minPrice: String(min), maxPrice: String(max) });
  };

  return (
    <div className="container-page py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {results.loading ? 'Searching…' : `${total.toLocaleString('en-IN')} product${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Sort
          <select className="input h-9 w-auto pr-8" value={sort} onChange={(e) => update({ sort: e.target.value === 'relevance' ? '' : e.target.value })}>
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Categories</p>
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-0.5 lg:px-0">
            <button
              type="button"
              onClick={() => update({ category: '' })}
              className={cx(
                'shrink-0 rounded-lg px-3 py-2 text-left text-sm transition',
                !category ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 dn-row'
              )}
            >
              All categories
            </button>
            {categoryList.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => update({ category: c.name })}
                className={cx(
                  'flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition',
                  category === c.name ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-600 dn-row'
                )}
              >
                {c.name}
                <span className="text-xs text-slate-400">{c.count}</span>
              </button>
            ))}
          </div>

          <form onSubmit={applyPrice} className="mt-6 max-w-sm">
            <p className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">Price</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Min ₹"
                aria-label="Minimum price"
                className="input h-9"
                value={priceDraft.min}
                onChange={(e) => setPriceDraft((d) => ({ ...d, min: e.target.value }))}
              />
              <span className="text-slate-400">–</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Max ₹"
                aria-label="Maximum price"
                className="input h-9"
                value={priceDraft.max}
                onChange={(e) => setPriceDraft((d) => ({ ...d, max: e.target.value }))}
              />
              <Button type="submit" size="sm" variant="secondary" className="h-9">
                Go
              </Button>
            </div>
          </form>
        </aside>

        <div className="min-w-0">
          {activeFilters.length ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeFilters.map(([keys, label]) => (
                <button
                  key={keys[0]}
                  type="button"
                  onClick={() => update(Object.fromEntries(keys.map((k) => [k, ''])))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                >
                  {label} <X className="size-3.5" />
                </button>
              ))}
            </div>
          ) : null}

          <ErrorBanner error={results.error} onRetry={results.reload} />

          {results.loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination className="mt-8" page={page} pages={pages} total={total} onChange={(n) => update({ page: String(n) })} />
            </>
          ) : !results.error && page > 1 && results.data.total > 0 ? (
            <div className="card">
              <EmptyState
                icon={SearchX}
                title="This page is empty"
                description={`There are only ${results.data.pages} page${results.data.pages === 1 ? '' : 's'} of results.`}
                action={
                  <Button variant="secondary" onClick={() => update({ page: '' })}>
                    Go to page 1
                  </Button>
                }
              />
            </div>
          ) : !results.error ? (
            <div className="card">
              <EmptyState
                icon={SearchX}
                title="No products found"
                description={
                  activeFilters.length
                    ? 'Nothing matches these filters — try removing one.'
                    : q
                      ? 'Try a shorter query, a brand name, or check the spelling.'
                      : 'The catalog is empty right now.'
                }
                action={
                  <div className="flex flex-col items-center gap-4">
                    {q || activeFilters.length ? (
                      <Button variant="secondary" to="/search">
                        Clear search & filters
                      </Button>
                    ) : null}
                    <div className="flex flex-wrap justify-center gap-2">
                      {['iPhone', 'Samsung', 'Laptop', 'Headphones', 'Nike'].map((s) => (
                        <Link
                          key={s}
                          to={`/search?q=${encodeURIComponent(s)}`}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-brand-300 hover:text-brand-700"
                        >
                          {s}
                        </Link>
                      ))}
                    </div>
                  </div>
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
