import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink, Pencil, RefreshCw } from 'lucide-react';
import { Button, Input, Modal, Select, StatusBadge, Toggle } from '../../components/ui';
import { Cell, DataTable, SearchInput, Toolbar } from '../../components/admin/kit';
import { adminApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { formatInr, timeAgo } from '../../lib/format';

const STATUSES = ['SUCCESS', 'PENDING', 'FAILED', 'PRODUCT_NOT_FOUND', 'OUT_OF_STOCK', 'TEMPORARILY_UNAVAILABLE'];

function EditModal({ row, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ productUrl: row.productUrl || '', affiliateUrl: row.affiliateUrl || '', title: row.title || '' });
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await adminApi.updateStoreProduct(row._id, form);
      onSaved(updated);
      toast.success('Listing updated');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Edit listing"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-listing" loading={busy}>Save</Button>
        </>
      }
    >
      <form id="edit-listing" onSubmit={save} className="space-y-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Input
          label="Product URL"
          type="url"
          value={form.productUrl}
          onChange={(e) => setForm({ ...form, productUrl: e.target.value })}
          hint="Changing the URL re-derives the external id (pid / ASIN) automatically."
          required
        />
        <Input label="Affiliate URL" type="url" value={form.affiliateUrl} onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })} placeholder="Optional" />
      </form>
    </Modal>
  );
}

export default function Listings() {
  useDocumentTitle('Store listings');
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const filters = {
    search: params.get('search') || '',
    storeId: params.get('storeId') || '',
    status: params.get('status') || '',
    liveOnly: params.get('liveOnly') || '',
  };
  const setFilter = (k, v) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
    setPage(1);
  };

  const stores = useAsync(() => adminApi.stores(), [], { initial: { items: [] } });
  const list = useAsync(() => adminApi.storeProducts({ ...filters, page, limit: 25 }), [page, ...Object.values(filters)], {
    initial: { items: [], total: 0, pages: 1 },
  });

  const patchRow = (updated) =>
    list.setData((d) => ({ ...d, items: d.items.map((r) => (r._id === updated._id ? { ...r, ...updated } : r)) }));

  const refresh = async (row) => {
    setBusy(row._id);
    try {
      const res = await adminApi.refreshListing(row._id);
      const r = res.result || {};
      if (r.failed) toast.error(`Check failed: ${r.error}`);
      else toast.success(r.changed ? `Price updated to ${formatInr(r.newPrice)}` : 'Price unchanged');
      list.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const toggleActive = async (row, isActive) => {
    try {
      patchRow(await adminApi.updateStoreProduct(row._id, { isActive }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Listing',
      className: 'max-w-[22rem]',
      render: (r) => <Cell title={r.title} sub={`${r.productId?.brand || ''} · ${r.externalProductId}`} />,
    },
    { key: 'store', header: 'Store', render: (r) => r.storeId?.name || '—' },
    {
      key: 'price',
      header: 'Price',
      render: (r) => (
        <div className="tabular-nums">
          <p className="font-semibold">{formatInr(r.currentPrice)}</p>
          {r.previousPrice ? <p className="text-xs text-slate-400 line-through">{formatInr(r.previousPrice)}</p> : null}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div>
          <StatusBadge status={r.scrapeStatus} />
          {r.consecutiveFailureCount ? <p className="mt-1 text-xs text-rose-600">{r.consecutiveFailureCount}× failed</p> : null}
        </div>
      ),
    },
    {
      key: 'checked',
      header: 'Checked',
      render: (r) => (
        <span className="text-xs text-slate-500" title={r.lastError || ''}>
          {timeAgo(r.lastCheckedAt)}
        </span>
      ),
    },
    { key: 'active', header: 'Active', render: (r) => <Toggle checked={r.isActive} onChange={(v) => toggleActive(r, v)} label="Active" /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => refresh(r)} loading={busy === r._id} aria-label="Refresh price">
            {busy === r._id ? null : <RefreshCw className="size-4" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(r)} aria-label="Edit">
            <Pencil className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" href={r.productUrl} target="_blank" rel="noopener noreferrer" aria-label="Open store page">
            <ExternalLink className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Toolbar>
        <SearchInput className="sm:w-72" value={filters.search} onChange={(v) => setFilter('search', v)} placeholder="Title, id, URL, seller…" />
        <Select value={filters.storeId} onChange={(e) => setFilter('storeId', e.target.value)} className="sm:w-40">
          <option value="">All stores</option>
          {stores.data.items.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className="sm:w-52">
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll('_', ' ').toLowerCase()}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" className="size-4 rounded accent-brand-600" checked={filters.liveOnly === 'true'} onChange={(e) => setFilter('liveOnly', e.target.checked ? 'true' : '')} />
          Live store URLs only
        </label>
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.data.items}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        empty="No listings match these filters"
        page={page}
        pages={list.data.pages}
        total={list.data.total}
        onPage={setPage}
      />
      {editing ? <EditModal row={editing} onClose={() => setEditing(null)} onSaved={patchRow} /> : null}
    </div>
  );
}
