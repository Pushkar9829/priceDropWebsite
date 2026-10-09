import { useState } from 'react';
import { ExternalLink, Pencil, Plus, RefreshCw } from 'lucide-react';
import { Badge, Button, Input, Modal, ProductThumb, Select, StoreLogo, Toggle } from '../../components/ui';
import { Cell, DataTable, SearchInput, Toolbar } from '../../components/admin/kit';
import { adminApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { formatInr, formatNumber, productImage, timeAgo } from '../../lib/format';

function ProductModal({ product, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: product.title || '',
    brand: product.brand || '',
    category: product.category || '',
    subCategory: product.subCategory || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      onSaved(await adminApi.updateProduct(product._id, form));
      toast.success('Product updated');
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
      title="Edit product"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="edit-product" loading={busy}>Save</Button>
        </>
      }
    >
      <form id="edit-product" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Input className="sm:col-span-2" label="Title" required value={form.title} onChange={set('title')} />
        <Input label="Brand" value={form.brand} onChange={set('brand')} />
        <Input label="Category" value={form.category} onChange={set('category')} />
        <Input className="sm:col-span-2" label="Sub-category" value={form.subCategory} onChange={set('subCategory')} />
      </form>
    </Modal>
  );
}

export function Products() {
  useDocumentTitle('Products');
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const list = useAsync(() => adminApi.products({ page, limit: 20, search, isActive }), [page, search, isActive], {
    initial: { items: [], pages: 1 },
  });

  const patch = (updated) =>
    list.setData((d) => ({ ...d, items: d.items.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)) }));

  const refresh = async (p) => {
    setBusy(p._id);
    try {
      const res = await adminApi.refreshProduct(p._id);
      const changed = (res.results || []).filter((r) => r?.changed).length;
      toast.success(`Checked ${res.results?.length || 0} listings · ${changed} changed`);
      list.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const toggle = async (p, v) => {
    try {
      patch(await adminApi.updateProduct(p._id, { isActive: v }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <Toolbar>
        <SearchInput className="sm:w-80" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search title or brand…" />
        <Select className="sm:w-40" value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(1); }}>
          <option value="">All</option>
          <option value="true">Visible</option>
          <option value="false">Hidden</option>
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
          {
            key: 'product',
            header: 'Product',
            className: 'max-w-[26rem]',
            render: (p) => (
              <div className="flex items-center gap-3">
                <ProductThumb src={productImage(p.images)} alt={p.title} className="size-11 shrink-0 rounded-lg border border-slate-100 [&_img]:p-1" compact />
                <Cell title={p.title} sub={[p.brand, p.category].filter(Boolean).join(' · ')} />
              </div>
            ),
          },
          { key: 'stores', header: 'Stores', render: (p) => <Badge tone={p.storeCount ? 'brand' : 'slate'}>{p.storeCount}</Badge> },
          {
            key: 'price',
            header: 'Price range',
            render: (p) => (
              <span className="tabular-nums">
                {formatInr(p.lowestPrice)}
                {p.highestPrice && p.highestPrice !== p.lowestPrice ? <span className="text-slate-400"> – {formatInr(p.highestPrice)}</span> : null}
              </span>
            ),
          },
          { key: 'updated', header: 'Updated', render: (p) => <span className="text-xs text-slate-500">{timeAgo(p.updatedAt)}</span> },
          { key: 'visible', header: 'Visible', render: (p) => <Toggle checked={p.isActive} onChange={(v) => toggle(p, v)} label="Visible" /> },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (p) => (
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" onClick={() => refresh(p)} loading={busy === p._id} aria-label="Refresh prices">
                  {busy === p._id ? null : <RefreshCw className="size-4" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(p)} aria-label="Edit">
                  <Pencil className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" to={`/products/${p._id}`} target="_blank" aria-label="View on site">
                  <ExternalLink className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
      />
      {editing ? <ProductModal product={editing} onClose={() => setEditing(null)} onSaved={patch} /> : null}
    </div>
  );
}

export function Stores() {
  useDocumentTitle('Stores');
  const toast = useToast();
  const list = useAsync(() => adminApi.stores(), [], { initial: { items: [] } });
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '', logo: '' });
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.createStore({ ...form, logo: form.logo || undefined });
      toast.success('Store created');
      setCreating(false);
      setForm({ name: '', domain: '', logo: '' });
      list.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (s, isActive) => {
    try {
      await adminApi.updateStore(s._id, { isActive });
      list.setData((d) => ({ ...d, items: d.items.map((x) => (x._id === s._id ? { ...x, isActive } : x)) }));
      toast.success(`${s.name} ${isActive ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">Disabled stores are hidden from comparisons and skipped by the price monitor.</p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Add store
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {list.data.items.map((s) => (
          <div key={s._id} className="card p-5">
            <div className="flex items-start gap-3">
              <StoreLogo store={s} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.name}</p>
                <p className="truncate text-xs text-slate-500">{s.domain}</p>
              </div>
              <Toggle checked={s.isActive} onChange={(v) => toggle(s, v)} label={`${s.name} active`} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge tone="brand">{formatNumber(s.listings)} listings</Badge>
              <Badge>{s.integrationType?.replaceAll('_', ' ').toLowerCase()}</Badge>
              <Badge>/{s.slug}</Badge>
            </div>
          </div>
        ))}
      </div>
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Add store"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" form="create-store" loading={busy}>Create</Button>
          </>
        }
      >
        <form id="create-store" onSubmit={create} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Domain" required placeholder="example.com" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
          <Input label="Logo URL" type="url" placeholder="Optional" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
          <p className="text-xs text-slate-500">Scraping only works for stores with a registered adapter (amazon, flipkart, croma, myntra).</p>
        </form>
      </Modal>
    </div>
  );
}
