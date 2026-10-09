import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Select, StatusBadge, Toggle, cx } from '../../components/ui';
import { Cell, DataTable, SearchInput, Toolbar } from '../../components/admin/kit';
import { adminApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatInr, idOf, timeAgo } from '../../lib/format';

function StoreSelect({ value, onChange }) {
  const stores = useAsync(() => adminApi.stores(), [], { initial: { items: [] } });
  return (
    <Select className="sm:w-40" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All stores</option>
      {stores.data.items.map((s) => (
        <option key={s._id} value={s._id}>
          {s.name}
        </option>
      ))}
    </Select>
  );
}

export function PriceHistory() {
  useDocumentTitle('Price history');
  const [page, setPage] = useState(1);
  const [f, setF] = useState({ search: '', storeId: '', changeType: '' });
  const set = (k) => (v) => {
    setF((cur) => ({ ...cur, [k]: v }));
    setPage(1);
  };
  const list = useAsync(() => adminApi.priceHistory({ ...f, page, limit: 30 }), [page, f], { initial: { items: [], pages: 1 } });

  return (
    <div>
      <Toolbar>
        <SearchInput className="sm:w-72" value={f.search} onChange={set('search')} placeholder="Product title or brand…" />
        <StoreSelect value={f.storeId} onChange={set('storeId')} />
        <Select className="sm:w-48" value={f.changeType} onChange={(e) => set('changeType')(e.target.value)}>
          <option value="">All changes</option>
          {['DECREASE', 'INCREASE', 'INITIAL', 'AVAILABILITY_CHANGE'].map((t) => (
            <option key={t} value={t}>
              {t.replaceAll('_', ' ').toLowerCase()}
            </option>
          ))}
        </Select>
      </Toolbar>
      <DataTable
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        rows={list.data.items}
        page={page}
        pages={list.data.pages}
        total={list.data.total}
        onPage={setPage}
        columns={[
          { key: 'when', header: 'Recorded', render: (h) => <span className="text-xs whitespace-nowrap text-slate-500">{formatDate(h.recordedAt)}</span> },
          {
            key: 'product',
            header: 'Product',
            className: 'max-w-[20rem]',
            render: (h) => (
              <Link to={`/products/${idOf(h.productId)}`} target="_blank" className="hover:text-brand-700">
                <Cell title={h.productId?.title || '—'} sub={h.productId?.brand} />
              </Link>
            ),
          },
          { key: 'store', header: 'Store', render: (h) => h.storeId?.name || '—' },
          {
            key: 'price',
            header: 'Price',
            render: (h) => (
              <span className="tabular-nums whitespace-nowrap">
                {h.previousPrice ? <span className="text-slate-400 line-through">{formatInr(h.previousPrice)}</span> : null}{' '}
                <span className="font-semibold">{formatInr(h.newPrice)}</span>
              </span>
            ),
          },
          {
            key: 'pct',
            header: 'Change',
            render: (h) =>
              h.percentageChange ? (
                <span className={cx('font-semibold tabular-nums', h.percentageChange < 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {h.percentageChange > 0 ? '+' : ''}
                  {h.percentageChange}%
                </span>
              ) : (
                '—'
              ),
          },
          {
            key: 'type',
            header: 'Type',
            render: (h) => (
              <div className="flex gap-1">
                <StatusBadge status={h.changeType} />
                {h.isHistoricalLow ? <Badge tone="brand">low</Badge> : null}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

export function Deals() {
  useDocumentTitle('Deals');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [f, setF] = useState({ search: '', storeId: '', dropSeverity: '', isActive: '' });
  const set = (k) => (v) => {
    setF((cur) => ({ ...cur, [k]: v }));
    setPage(1);
  };
  const list = useAsync(() => adminApi.deals({ ...f, page, limit: 20 }), [page, f], { initial: { items: [], pages: 1 } });

  const toggle = async (d, isActive) => {
    try {
      const updated = await adminApi.updateDeal(d._id, { isActive });
      list.setData((cur) => ({ ...cur, items: cur.items.map((x) => (x._id === d._id ? { ...x, ...updated } : x)) }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Toolbar>
        <SearchInput className="sm:w-72" value={f.search} onChange={set('search')} placeholder="Search deals…" />
        <StoreSelect value={f.storeId} onChange={set('storeId')} />
        <Select className="sm:w-44" value={f.dropSeverity} onChange={(e) => set('dropSeverity')(e.target.value)}>
          <option value="">Any severity</option>
          {['HISTORICAL_LOW', 'MAJOR', 'SIGNIFICANT', 'NORMAL'].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll('_', ' ').toLowerCase()}
            </option>
          ))}
        </Select>
        <Select className="sm:w-36" value={f.isActive} onChange={(e) => set('isActive')(e.target.value)}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </Toolbar>
      <DataTable
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        rows={list.data.items}
        page={page}
        pages={list.data.pages}
        total={list.data.total}
        onPage={setPage}
        columns={[
          { key: 'title', header: 'Deal', className: 'max-w-[22rem]', render: (d) => <Cell title={d.productId?.title || d.title} sub={d.description} /> },
          { key: 'store', header: 'Store', render: (d) => d.storeId?.name || '—' },
          {
            key: 'price',
            header: 'Price',
            render: (d) => (
              <span className="tabular-nums whitespace-nowrap">
                <span className="text-slate-400 line-through">{formatInr(d.previousPrice)}</span> <span className="font-semibold">{formatInr(d.currentPrice)}</span>
              </span>
            ),
          },
          { key: 'pct', header: 'Off', render: (d) => <span className="font-semibold text-emerald-600">{Math.round(d.discountPercent || 0)}%</span> },
          { key: 'sev', header: 'Severity', render: (d) => <StatusBadge status={d.dropSeverity} /> },
          { key: 'exp', header: 'Expires', render: (d) => <span className="text-xs text-slate-500">{d.expiresAt ? timeAgo(d.expiresAt) : 'never'}</span> },
          { key: 'active', header: 'Active', render: (d) => <Toggle checked={d.isActive} onChange={(v) => toggle(d, v)} label="Active" /> },
        ]}
      />
    </div>
  );
}

export function Users() {
  useDocumentTitle('Users');
  const toast = useToast();
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const list = useAsync(() => adminApi.users({ page, limit: 20, search }), [page, search], { initial: { items: [], pages: 1 } });

  const update = async (u, body) => {
    try {
      const updated = await adminApi.updateUser(u._id, body);
      list.setData((cur) => ({ ...cur, items: cur.items.map((x) => (x._id === u._id ? updated : x)) }));
      toast.success('User updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Toolbar>
        <SearchInput className="sm:w-80" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Name or email…" />
      </Toolbar>
      <DataTable
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        rows={list.data.items}
        page={page}
        pages={list.data.pages}
        total={list.data.total}
        onPage={setPage}
        columns={[
          {
            key: 'user',
            header: 'User',
            render: (u) => (
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {(u.name || '?').slice(0, 1).toUpperCase()}
                </span>
                <Cell title={u.name} sub={u.email} />
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (u) =>
              u._id === me?.id ? (
                <StatusBadge status={u.role} />
              ) : (
                <select className="input h-8 w-28 text-xs" value={u.role} onChange={(e) => update(u, { role: e.target.value })}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              ),
          },
          { key: 'joined', header: 'Joined', render: (u) => <span className="text-xs text-slate-500">{formatDate(u.createdAt, false)}</span> },
          {
            key: 'active',
            header: 'Active',
            render: (u) =>
              u._id === me?.id ? <Badge tone="brand">You</Badge> : <Toggle checked={u.isActive} onChange={(v) => update(u, { isActive: v })} label="Active" />,
          },
        ]}
      />
    </div>
  );
}

export function Notifications() {
  useDocumentTitle('Notifications');
  const [page, setPage] = useState(1);
  const list = useAsync(() => adminApi.notifications({ page, limit: 30 }), [page], { initial: { items: [], pages: 1 } });
  return (
    <DataTable
      loading={list.loading}
      error={list.error}
      onRetry={list.reload}
      rows={list.data.items}
      page={page}
      pages={list.data.pages}
      total={list.data.total}
      onPage={setPage}
      columns={[
        { key: 'when', header: 'Created', render: (n) => <span className="text-xs whitespace-nowrap text-slate-500">{formatDate(n.createdAt)}</span> },
        { key: 'user', header: 'User', render: (n) => <Cell title={n.userId?.name || '—'} sub={n.userId?.email} /> },
        { key: 'channel', header: 'Channel', render: (n) => <Badge>{n.channel}</Badge> },
        { key: 'msg', header: 'Message', className: 'max-w-[26rem]', render: (n) => <span className="line-clamp-2 text-xs text-slate-600">{n.message}</span> },
        { key: 'status', header: 'Status', render: (n) => <StatusBadge status={n.status} /> },
      ]}
    />
  );
}
