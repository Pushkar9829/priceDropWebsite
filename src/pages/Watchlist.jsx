import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { watchlistApi } from '../api/shop';
import { formatInr, productImage } from '../utils/format';

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await watchlistApi.list();
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (productId) => {
    try {
      await watchlistApi.remove(productId);
      setItems((prev) =>
        prev.filter((i) => {
          const pid = i.product?.id || i.product?._id;
          return String(pid) !== String(productId);
        })
      );
    } catch (err) {
      setError(err.message || 'Could not remove');
    }
  };

  return (
    <div className="container py-10">
      <header className="page-head">
        <h1>Watchlist</h1>
        <p>Products you’re keeping an eye on.</p>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <div className="skeleton h-40" /> : null}

      {!loading && !items.length ? (
        <div className="empty">
          <p>Nothing saved yet.</p>
          <Link to="/search?q=iphone" className="btn btn-primary mt-4">
            Find a product
          </Link>
        </div>
      ) : null}

      <div className="divide-y divide-line rounded-md border border-line bg-elevated">
        {items.map((item) => {
          const p = item.product;
          const pid = p?.id || p?._id;
          const img = productImage(p?.images);
          return (
            <article
              key={item.id || item._id}
              className="flex flex-wrap items-center justify-between gap-4 px-4 py-4"
            >
              <Link to={`/products/${pid}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[rgba(15,23,42,0.04)]">
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-ink-faint">{p?.brand?.[0] || 'P'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{p?.title}</h3>
                  <p className="price mt-1">{formatInr(p?.lowestPrice)}</p>
                </div>
              </Link>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => remove(pid)}
              >
                Remove
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
