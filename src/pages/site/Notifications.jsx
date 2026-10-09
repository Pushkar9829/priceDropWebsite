import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { Button, EmptyState, ErrorBanner, Pagination, Skeleton, cx } from '../../components/ui';
import { notificationApi, notifyInboxChanged } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../lib/format';
import { PageHeader } from './Watchlist';

export default function Notifications() {
  useDocumentTitle('Notifications');
  const toast = useToast();
  // Page lives in the URL so Back returns to the same page
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const setPage = (n) => setParams(n > 1 ? { page: String(n) } : {});
  const list = useAsync(() => notificationApi.list({ page, limit: 20 }), [page], { initial: { items: [], unread: 0 } });
  const [busy, setBusy] = useState(false);

  const markRead = async (n) => {
    if (n.status === 'READ') return;
    list.setData((d) => ({
      ...d,
      unread: Math.max(0, (d.unread || 0) - 1),
      items: d.items.map((x) => (x._id === n._id ? { ...x, status: 'READ' } : x)),
    }));
    notificationApi
      .markRead(n._id)
      .then(notifyInboxChanged)
      .catch(() => {
        // Roll back the optimistic update so the list matches the server (and the badge)
        list.setData((d) => ({
          ...d,
          unread: (d.unread || 0) + 1,
          items: d.items.map((x) => (x._id === n._id ? { ...x, status: n.status } : x)),
        }));
      });
  };

  const markAll = async () => {
    setBusy(true);
    try {
      await notificationApi.markAllRead();
      notifyInboxChanged();
      list.setData((d) => ({ ...d, unread: 0, items: d.items.map((x) => ({ ...x, status: 'READ' })) }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const { items, unread } = list.data;
  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : 'You’re all caught up'}
        action={
          unread ? (
            <Button variant="secondary" onClick={markAll} loading={busy}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          ) : null
        }
      />
      <ErrorBanner error={list.error} onRetry={list.reload} />
      {list.loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {items.map((n) => {
              const unreadItem = n.status !== 'READ';
              const pid = n.meta?.productId;
              const Body = (
                <div className={cx('flex gap-3 px-5 py-4 transition hover:bg-slate-50', unreadItem && 'bg-brand-50/40')}>
                  <span className={cx('mt-1.5 size-2 shrink-0 rounded-full', unreadItem ? 'bg-brand-500' : 'bg-transparent')} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className={cx('text-sm', unreadItem ? 'font-semibold' : 'font-medium text-slate-700')}>{n.title}</p>
                      <span className="shrink-0 text-xs text-slate-400">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                  </div>
                </div>
              );
              return pid ? (
                <Link key={n._id} to={`/products/${pid}`} onClick={() => markRead(n)} className="block">
                  {Body}
                </Link>
              ) : (
                <button key={n._id} type="button" onClick={() => markRead(n)} className="block w-full text-left">
                  {Body}
                </button>
              );
            })}
          </div>
          <Pagination className="mt-6" page={page} pages={list.data.pages} total={list.data.total} onChange={setPage} />
        </>
      ) : !list.error ? (
        <div className="card">
          <EmptyState icon={Bell} title="No notifications" description="Price alert notifications will appear here." />
        </div>
      ) : null}
    </div>
  );
}
