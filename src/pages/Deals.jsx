import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dealApi } from '../api/shop';
import Pagination, { PAGE_SIZE } from '../components/Pagination';
import { formatInr, productImage } from '../utils/format';

export default function Deals() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    dealApi
      .list({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load deals');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="container py-10">
      <header className="page-head">
        <h1>Deals</h1>
        <p>Highlighted drops across tracked stores.</p>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-56" />
          ))}
        </div>
      ) : null}

      {!loading && !data.items.length && !error ? (
        <div className="empty">
          <p>No active deals yet. Search a product to compare live listings.</p>
          <Link to="/search?q=iphone" className="btn btn-primary mt-4">
            Search products
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((deal, i) => {
          const product = deal.productId;
          const productId = product?._id || product?.id;
          const img = productImage(product?.images);
          return (
            <motion.article
              key={deal._id || deal.id}
              className="product-tile"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link
                to={productId ? `/products/${productId}` : '/deals'}
                className="block"
              >
                <div className="relative flex aspect-[16/10] items-center justify-center bg-[var(--dn-surface-2)]">
                  {deal.discountPercent != null ? (
                    <span className="dn-badge-discount absolute left-3 top-3 z-10">
                      {deal.discountPercent}% OFF
                    </span>
                  ) : null}
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-contain p-4" />
                  ) : (
                    <span className="font-display text-2xl text-ink-faint">
                      {product?.brand?.[0] || '%'}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 p-4">
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug">
                    {deal.title || product?.title}
                  </h3>
                  <p className="price text-lg">{formatInr(deal.currentPrice)}</p>
                  <p className="muted text-sm">{deal.storeId?.name}</p>
                </div>
              </Link>
            </motion.article>
          );
        })}
      </div>

      <Pagination
        page={data.page || page}
        pages={data.pages || 1}
        total={data.total || 0}
        limit={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
