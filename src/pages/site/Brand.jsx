import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, PackageSearch } from 'lucide-react';
import ProductCard, { ProductCardSkeleton } from '../../components/site/ProductCard';
import { BrandLogo } from '../../components/site/BrandCard';
import { Button, EmptyState, ErrorBanner, Pagination } from '../../components/ui';
import { productApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';

const SORTS = [
  ['relevance', 'Freshest prices'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
];

export default function Brand() {
  const { name } = useParams();
  // The router already decodes params — decoding again breaks names containing "%"
  const brand = name || '';
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') || 'relevance';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  useDocumentTitle(brand);

  const list = useAsync(() => productApi.search({ brand, sort, page, limit: 24 }), [brand, sort, page], {
    initial: { items: [], total: 0, pages: 1 },
  });
  const items = list.data.items;
  const category = items[0]?.category;
  const deals = items.filter((p) => p.discountPercent > 0).length;
  const maxOff = Math.max(0, ...items.map((p) => p.discountPercent || 0));

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== 'relevance' ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };

  return (
    <div className="container-page py-8">
      <button
        type="button"
        // 'default' key = first page in this tab (arrived from outside) → go home instead of leaving the site
        onClick={() => (location.key !== 'default' ? navigate(-1) : navigate('/'))}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo name={brand} size="lg" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{brand}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-slate-500">
              {category ? <span>{category}</span> : null}
              {!list.loading ? <span>{list.data.total} product{list.data.total === 1 ? '' : 's'}</span> : null}
              {deals ? <span className="font-semibold text-brand-600">Up to {maxOff}% off</span> : null}
            </p>
          </div>
        </div>
        {items.length ? (
          <select className="input h-10 w-auto rounded-full pr-8" value={sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort">
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="mt-8">
        <ErrorBanner error={list.error} onRetry={list.reload} />
        {list.loading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <Pagination className="mt-8" page={page} pages={list.data.pages} total={list.data.total} onChange={(n) => set({ page: String(n) })} />
          </>
        ) : !list.error ? (
          <div className="card">
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description={`We don't have any ${brand} products tracked yet.`}
              action={
                <Button to="/" className="rounded-full">
                  Browse other brands
                </Button>
              }
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
