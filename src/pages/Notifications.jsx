import { useEffect, useState } from 'react';
import { notificationApi } from '../api/shop';
import Pagination, { PAGE_SIZE } from '../components/Pagination';

export default function Notifications() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = async (nextPage = page) => {
    setLoading(true);
    setError('');
    try {
      const result = await notificationApi.list({ page: nextPage, limit: PAGE_SIZE });
      setData(result);
      setPage(result.page || nextPage);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const markRead = async (id) => {
    setBusyId(id);
    try {
      await notificationApi.markRead(id);
      setData((prev) => ({
        ...prev,
        items: (prev.items || []).map((n) =>
          String(n._id || n.id) === String(id)
            ? { ...n, status: 'READ', readAt: new Date().toISOString() }
            : n
        ),
      }));
    } catch (err) {
      setError(err.message || 'Could not mark as read');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="container py-10">
      <header className="page-head">
        <h1>Inbox</h1>
        <p>Price alerts and account notifications.</p>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}
      {loading ? <div className="skeleton h-40" /> : null}

      {!loading && !data.items.length ? (
        <div className="empty">
          <p>No notifications yet. Set a price alert to get started.</p>
        </div>
      ) : null}

      <div className="divide-y divide-line rounded-md border border-line bg-elevated">
        {(data.items || []).map((n) => {
          const id = n._id || n.id;
          const unread = n.status !== 'READ' && !n.readAt;
          return (
            <article
              key={id}
              className={`flex flex-wrap items-start justify-between gap-4 px-4 py-4 ${
                unread ? 'bg-teal-wash/40' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{n.title || n.type || 'Notification'}</h3>
                  {unread ? <span className="badge">New</span> : null}
                </div>
                <p className="muted mt-1 text-sm">{n.message || n.body || '—'}</p>
                <p className="muted mt-2 text-xs tabular-nums">
                  {n.createdAt
                    ? new Date(n.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>
              {unread ? (
                <button
                  type="button"
                  className="btn btn-soft"
                  disabled={busyId === id}
                  onClick={() => markRead(id)}
                >
                  Mark read
                </button>
              ) : null}
            </article>
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
