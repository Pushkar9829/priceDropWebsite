import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { alertApi } from '../api/shop';
import Toggle from '../components/Toggle';
import { formatInr } from '../utils/format';

export default function Alerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await alertApi.list();
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    setBusyId(id);
    try {
      await alertApi.remove(id);
      setItems((prev) => prev.filter((a) => String(a._id || a.id) !== String(id)));
    } catch (err) {
      setError(err.message || 'Could not cancel alert');
    } finally {
      setBusyId('');
    }
  };

  const togglePause = async (alert) => {
    const id = alert._id || alert.id;
    const next = alert.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
    setBusyId(id);
    try {
      const updated = await alertApi.update(id, { status: next });
      setItems((prev) =>
        prev.map((a) => (String(a._id || a.id) === String(id) ? { ...a, ...updated } : a))
      );
    } catch (err) {
      setError(err.message || 'Could not update alert');
    } finally {
      setBusyId('');
    }
  };

  const saveTarget = async (id) => {
    setBusyId(id);
    try {
      const updated = await alertApi.update(id, { targetPrice: Number(editTarget) });
      setItems((prev) =>
        prev.map((a) => (String(a._id || a.id) === String(id) ? { ...a, ...updated } : a))
      );
      setEditId('');
    } catch (err) {
      setError(err.message || 'Could not update target');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="container py-10">
      <header className="page-head">
        <h1>Price alerts</h1>
        <p>We’ll notify you when a listing hits your target.</p>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <div className="skeleton h-40" /> : null}

      {!loading && !items.length ? (
        <div className="empty">
          <p>No alerts yet. Open a product and set a target price.</p>
          <Link to="/search?q=iphone" className="btn btn-primary mt-4">
            Browse products
          </Link>
        </div>
      ) : null}

      <div className="divide-y divide-line rounded-md border border-line bg-elevated">
        {items.map((alert) => {
          const id = alert._id || alert.id;
          const title = alert.productId?.title || alert.product?.title || 'Product';
          const productId =
            alert.productId?._id || alert.productId?.id || alert.productId;
          const editing = editId === String(id);

          return (
            <article
              key={id}
              className="flex flex-wrap items-center justify-between gap-4 px-4 py-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">
                  {productId ? (
                    <Link to={`/products/${productId}`} className="hover:text-teal">
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                </h3>
                {editing ? (
                  <div className="mt-2 flex max-w-xs gap-2">
                    <input
                      className="field"
                      type="number"
                      min="0"
                      value={editTarget}
                      onChange={(e) => setEditTarget(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={busyId === id}
                      onClick={() => saveTarget(id)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setEditId('')}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="muted mt-1 text-sm">
                    Target {formatInr(alert.targetPrice)}
                    {alert.status ? ` · ${alert.status}` : ''}
                    {alert.currentPrice != null
                      ? ` · now ${formatInr(alert.currentPrice)}`
                      : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Toggle
                  checked={alert.status !== 'PAUSED'}
                  disabled={busyId === id}
                  labelOn="On"
                  labelOff="Off"
                  aria-label={
                    alert.status === 'PAUSED' ? 'Turn alert on' : 'Turn alert off'
                  }
                  onChange={() => togglePause(alert)}
                />
                {!editing ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setEditId(String(id));
                      setEditTarget(String(alert.targetPrice ?? ''));
                    }}
                  >
                    Edit
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={busyId === id}
                  onClick={() => remove(id)}
                >
                  Cancel
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
