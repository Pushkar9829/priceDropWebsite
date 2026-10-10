import { useSearchParams } from 'react-router-dom';
import { TrendingDown } from 'lucide-react';
import DealCard from '../../components/site/DealCard';
import { ProductCardSkeleton } from '../../components/site/ProductCard';
import { Button, EmptyState, ErrorBanner, Pagination, staggerStyle } from '../../components/ui';
import { dealApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';

export default function Deals() {
  useDocumentTitle('Deals');
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const deals = useAsync(() => dealApi.list({ page, limit: 24 }), [page], { initial: { items: [], total: 0, pages: 1 } });

  return (
    <div className="container-page py-8">
      <div className="relative overflow-hidden rounded-3xl border border-[#3e3f42]/50 bg-[#252627] px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2fda76]/[0.08] via-transparent to-[#2fda76]/5" />
        <div className="dn-blobs" />
        <TrendingDown className="absolute -right-6 -bottom-6 size-40 text-[#2fda76]/10" />
        <h1 className="dn-enter dn-d1 relative text-3xl font-extrabold tracking-tight">Today&apos;s price drops</h1>
        <p className="dn-enter dn-d15 relative mt-2 max-w-lg text-slate-500">
          Real drops detected by our hourly price checks — biggest discounts first. Deals expire after 7 days.
        </p>
      </div>

      <div className="mt-8">
        <ErrorBanner error={deals.error} onRetry={deals.reload} />
        {deals.loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : deals.data.items.length ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {deals.data.items.map((d, i) => (
                <div key={d._id} className="dn-stagger" style={staggerStyle(i)}>
                  <DealCard deal={d} />
                </div>
              ))}
            </div>
            <Pagination
              className="mt-8"
              page={page}
              pages={deals.data.pages}
              total={deals.data.total}
              onChange={(n) => {
                setParams({ page: String(n) });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        ) : !deals.error ? (
          <div className="card">
            <EmptyState
              icon={TrendingDown}
              title="No active deals"
              description="When a tracked price drops 5% or more, it shows up here."
              action={<Button to="/search">Browse products</Button>}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
