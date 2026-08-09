import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../api/shop';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';
import Pagination, { PAGE_SIZE } from '../components/Pagination';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    productApi
      .search(q.trim(), { page, limit: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Search failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, page]);

  const setPage = (next) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('page', String(next));
    setParams(nextParams);
  };

  const hasQuery = Boolean(q.trim());

  return (
    <div className="container py-10">
      <header className="page-head">
        <h1>{hasQuery ? 'Compare prices' : 'Catalog'}</h1>
        <p>
          {hasQuery
            ? 'Results from our catalog across Amazon & Flipkart.'
            : 'Browse products we already track, or search for something new.'}
        </p>
        <div className="mt-4">
          <SearchBar initial={q} />
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      ) : null}

      {!loading && hasQuery && !data.items.length && !error ? (
        <div className="empty">
          <p>No matches for “{q}”. Try a brand or model name.</p>
        </div>
      ) : null}

      {!loading && !hasQuery && !data.items.length && !error ? (
        <div className="empty">
          <p>No catalog products yet. Search a product to pull live listings.</p>
        </div>
      ) : null}

      {!loading && !!data.items.length ? (
        <>
          <p className="muted mb-4 text-sm">
            {data.total || data.items.length}{' '}
            {hasQuery
              ? `result${(data.total || data.items.length) === 1 ? '' : 's'} for “${q}”`
              : `product${(data.total || data.items.length) === 1 ? '' : 's'} in catalog`}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item, i) => (
              <ProductCard key={item.id || item._id} product={item} index={i} />
            ))}
          </div>
          <Pagination
            page={data.page || page}
            pages={data.pages || 1}
            total={data.total || data.items.length}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      ) : null}
    </div>
  );
}
