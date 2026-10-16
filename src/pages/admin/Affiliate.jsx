import { useEffect, useState } from 'react';
import { ExternalLink, Pin, RefreshCw, Store, Ticket, Eye, EyeOff, Star } from 'lucide-react';
import { Badge, Button, Input, Select, Toggle } from '../../components/ui';
import { Cell, DataTable, SearchInput, StatCard, Toolbar, useJob } from '../../components/admin/kit';
import { adminApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../lib/format';

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

/** Admin → Affiliate settings: sections, Cuelinks, Travelpayouts, hidden lists, sync. */
export function AffiliateSettings() {
  useDocumentTitle('Affiliate settings');
  const toast = useToast();
  const status = useAsync(() => adminApi.affiliateStatus(), [], { initial: {} });
  const settings = useAsync(() => adminApi.affiliateSettings(), [], { initial: null });
  const [form, setForm] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [tpToken, setTpToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [jobId, setJobId] = useState(null);

  useEffect(() => {
    const s = settings.data;
    if (!s) return;
    setForm({
      sections: { ...s.sections },
      cid: s.cuelinks.cid || '',
      syncEnabled: s.cuelinks.syncEnabled,
      marker: s.travelpayouts.marker || '',
      flightsWidgetSrc: s.travelpayouts.flightsWidgetSrc || '',
      hotelsWidgetSrc: s.travelpayouts.hotelsWidgetSrc || '',
      originCities: (s.travelpayouts.originCities || []).join(', '),
      hiddenCategories: (s.hiddenCategories || []).join(', '),
      hiddenDomains: (s.hiddenDomains || []).join(', '),
    });
  }, [settings.data]);

  const job = useJob(jobId, {
    onDone: (j) => {
      setJobId(null);
      status.reload();
      if (j.status === 'completed') toast.success(`Synced ${fmt(j.result?.campaigns)} stores and ${fmt(j.result?.offers)} offers`);
      else toast.error(j.error || 'Sync failed');
    },
  });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await adminApi.updateAffiliateSettings({
        sections: form.sections,
        cuelinks: { cid: form.cid, syncEnabled: form.syncEnabled, ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}) },
        travelpayouts: {
          marker: form.marker,
          flightsWidgetSrc: form.flightsWidgetSrc,
          hotelsWidgetSrc: form.hotelsWidgetSrc,
          originCities: form.originCities,
          ...(tpToken.trim() ? { apiToken: tpToken.trim() } : {}),
        },
        hiddenCategories: form.hiddenCategories,
        hiddenDomains: form.hiddenDomains,
      });
      settings.setData(saved);
      setApiKey('');
      setTpToken('');
      toast.success('Settings saved — the website picks them up within a minute');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const clearKey = async () => {
    try {
      settings.setData(await adminApi.updateAffiliateSettings({ cuelinks: { apiKey: null } }));
      toast.success('Stored API key removed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const sync = async () => {
    try {
      const res = await adminApi.syncAffiliate();
      setJobId(res.job.id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const st = status.data || {};
  const last = st.lastSync;
  const s = settings.data;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Partner stores" value={fmt(st.campaigns)} hint={`${fmt(st.usable)} usable now`} icon={Store} />
        <StatCard label="Live offers" value={fmt(st.liveOffers)} hint={`${fmt(st.offers)} stored`} icon={Ticket} tone="green" />
        <StatCard label="Hidden / featured" value={`${fmt(st.hidden)} / ${fmt(st.featured)}`} hint="Admin overrides" icon={EyeOff} />
        <StatCard
          label="Last sync"
          value={last?.at ? timeAgo(last.at) : 'Never'}
          hint={last ? (last.ok ? `${fmt(last.campaigns)} stores · ${fmt(last.offers)} offers` : `Failed: ${String(last.error || '').slice(0, 60)}`) : 'Add an API key, then sync'}
          icon={RefreshCw}
          tone={last && !last.ok ? 'red' : 'brand'}
        />
      </div>

      <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Sync Cuelinks now</p>
          <p className="text-sm text-slate-500">
            Pulls every India campaign and live coupon. Runs automatically every night when enabled below.
          </p>
        </div>
        <Button onClick={sync} loading={Boolean(jobId)} disabled={!s?.cuelinks?.hasApiKey}>
          <RefreshCw className="size-4" /> {jobId ? job?.progress?.message || 'Syncing…' : 'Sync now'}
        </Button>
      </div>

      {form ? (
        <form onSubmit={save} className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold">Sections on the website</h2>
            <p className="mb-4 text-sm text-slate-500">Turned-off sections disappear from the menu and their pages.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['offers', 'Coupons & offers', '/offers'],
                ['stores', 'Stores directory', '/stores'],
                ['travel', 'Travel', '/travel'],
              ].map(([k, label, path]) => (
                <div key={k} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-slate-500">{path}</p>
                  </div>
                  <Toggle checked={form.sections[k]} onChange={(v) => set('sections', { ...form.sections, [k]: v })} label={label} />
                </div>
              ))}
            </div>
          </section>

          <section className="card space-y-4 p-5">
            <div>
              <h2 className="font-semibold">Cuelinks</h2>
              <p className="text-sm text-slate-500">Every store link on the site goes through this channel, so sales are credited to you.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Channel ID (cid)" value={form.cid} onChange={(e) => set('cid', e.target.value)} hint="Cuelinks → Channels. Empty = links go out untracked." />
              <div>
                <Input
                  label="API key (V3)"
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={s?.cuelinks?.hasApiKey ? `Saved ${s.cuelinks.apiKeyHint} — type to replace` : 'Paste key (read:campaigns, read:offers)'}
                  hint={s?.cuelinks?.apiKeySource === 'server' ? 'Using the key from the server environment' : 'Stored securely; never shown again'}
                />
                {s?.cuelinks?.apiKeySource === 'admin' ? (
                  <button type="button" onClick={clearKey} className="mt-1 text-xs text-rose-600 hover:underline">
                    Remove stored key
                  </button>
                ) : null}
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <Toggle checked={form.syncEnabled} onChange={(v) => set('syncEnabled', v)} label="Nightly sync" />
              Sync stores and coupons automatically every night
            </label>
          </section>

          <section className="card space-y-4 p-5">
            <div>
              <h2 className="font-semibold">Travelpayouts</h2>
              <p className="text-sm text-slate-500">
                Paste the widget code from Travelpayouts → Tools → Widgets (the whole &lt;script&gt; snippet or just its URL). Only Travelpayouts
                scripts are accepted.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Marker (partner ID)" value={form.marker} onChange={(e) => set('marker', e.target.value)} hint="Added to every flight booking link so bookings are credited to you" />
              <Input
                label="API token (cheap-fare cards)"
                type="password"
                autoComplete="off"
                value={tpToken}
                onChange={(e) => setTpToken(e.target.value)}
                placeholder={s?.travelpayouts?.hasApiToken ? `Saved ${s.travelpayouts.apiTokenHint} — type to replace` : 'Travelpayouts → Profile → API token'}
                hint={s?.travelpayouts?.apiTokenSource === 'server' ? 'Using the token from the server environment' : 'Stored securely; never shown again'}
              />
            </div>
            <Input
              label="Departure cities for “Cheap flights from…”"
              value={form.originCities}
              onChange={(e) => set('originCities', e.target.value)}
              hint="3-letter codes, comma-separated, e.g. DEL, BOM, BLR, HYD, MAA, CCU"
            />
            <label className="block">
              <span className="label">Flights search widget</span>
              <textarea className="input h-20 py-2 font-mono text-xs" value={form.flightsWidgetSrc} onChange={(e) => set('flightsWidgetSrc', e.target.value)} placeholder='<script async src="https://tp.media/content?…" charset="utf-8"></script>' />
            </label>
            <label className="block">
              <span className="label">Hotels search widget</span>
              <textarea className="input h-20 py-2 font-mono text-xs" value={form.hotelsWidgetSrc} onChange={(e) => set('hotelsWidgetSrc', e.target.value)} placeholder='<script async src="https://tp.media/content?…" charset="utf-8"></script>' />
            </label>
          </section>

          <section className="card space-y-4 p-5">
            <div>
              <h2 className="font-semibold">Hide from the website</h2>
              <p className="text-sm text-slate-500">Comma-separated. Single stores and offers can also be hidden from their own tabs.</p>
            </div>
            <Input label="Hidden categories" value={form.hiddenCategories} onChange={(e) => set('hiddenCategories', e.target.value)} hint="e.g. Finance, Credit Card" />
            <Input label="Hidden store websites" value={form.hiddenDomains} onChange={(e) => set('hiddenDomains', e.target.value)} hint="e.g. mymuse.in" />
          </section>

          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Save settings
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

/** Admin → Partner stores: every Cuelinks campaign, with hide / feature switches. */
export function PartnerStores() {
  useDocumentTitle('Partner stores');
  const toast = useToast();
  const [filters, setFilters] = useState({ q: '', status: 'usable', visibility: '' });
  const [page, setPage] = useState(1);
  const list = useAsync(() => adminApi.affiliateCampaigns({ ...filters, page, limit: 25 }), [filters, page], {
    initial: { items: [], total: 0, pages: 1 },
  });
  const setFilter = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  const update = async (row, patch) => {
    try {
      const next = await adminApi.updateAffiliateCampaign(row.id, patch);
      list.setData((d) => ({ ...d, items: d.items.map((x) => (x.id === row.id ? { ...x, ...next } : x)) }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'name', header: 'Store', className: 'max-w-[18rem]', render: (r) => <Cell title={r.name} sub={r.domain} /> },
    {
      key: 'access',
      header: 'Cuelinks access',
      render: (r) => <Badge tone={r.usable ? 'green' : r.accessStatus === 'pending' ? 'amber' : 'slate'}>{r.accessStatus.replace('_', ' ')}</Badge>,
    },
    { key: 'payout', header: 'Commission', render: (r) => `${r.payout}${r.payoutCurrency === '%' ? '%' : ` ${r.payoutCurrency}`}` },
    { key: 'epc', header: 'EPC (90d)', render: (r) => (r.epc90d ? `₹${r.epc90d.toFixed(2)}` : '—') },
    { key: 'offers', header: 'Offers', render: (r) => fmt(r.offerCount) },
    { key: 'featured', header: 'Featured', render: (r) => <Toggle checked={r.adminFeatured} onChange={(v) => update(r, { adminFeatured: v })} label={`Feature ${r.name}`} /> },
    { key: 'visible', header: 'Visible', render: (r) => <Toggle checked={!r.adminHidden} onChange={(v) => update(r, { adminHidden: !v })} label={`Show ${r.name}`} /> },
    {
      key: 'open',
      header: '',
      render: (r) =>
        r.slug && r.usable ? (
          <Button size="icon" variant="ghost" href={`/stores/${r.slug}`} target="_blank" rel="noopener noreferrer" aria-label="Open store page">
            <ExternalLink className="size-4" />
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Stores come from Cuelinks automatically. Featured stores show first; hidden stores and their offers disappear from the website.
      </p>
      <Toolbar>
        <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Search store or website" className="sm:w-72" />
        <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Access">
          <option value="usable">Usable now</option>
          <option value="">All</option>
          <option value="pending">Pending approval</option>
          <option value="not_applied">Not applied</option>
          <option value="rejected">Rejected</option>
        </Select>
        <Select value={filters.visibility} onChange={(e) => setFilter('visibility', e.target.value)} aria-label="Visibility">
          <option value="">Any visibility</option>
          <option value="featured">Featured</option>
          <option value="hidden">Hidden</option>
        </Select>
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.data.items}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        empty="No stores — run a sync in Affiliate settings"
        page={page}
        pages={list.data.pages}
        total={list.data.total}
        onPage={setPage}
      />
    </div>
  );
}

/** Admin → Offers: every synced coupon/deal, with hide / pin switches. */
export function AffiliateOffers() {
  useDocumentTitle('Offers');
  const toast = useToast();
  const [filters, setFilters] = useState({ q: '', visibility: '' });
  const [page, setPage] = useState(1);
  const list = useAsync(() => adminApi.affiliateOffers({ ...filters, page, limit: 25 }), [filters, page], {
    initial: { items: [], total: 0, pages: 1 },
  });
  const setFilter = (k, v) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  const update = async (row, patch) => {
    try {
      const next = await adminApi.updateAffiliateOffer(row.id, patch);
      list.setData((d) => ({ ...d, items: d.items.map((x) => (x.id === row.id ? { ...x, ...next } : x)) }));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'title', header: 'Offer', className: 'max-w-[26rem]', render: (r) => <Cell title={r.title} sub={r.store?.name} /> },
    { key: 'code', header: 'Code', render: (r) => (r.couponCode ? <span className="font-mono text-xs">{r.couponCode}</span> : '—') },
    { key: 'ends', header: 'Ends', render: (r) => (r.endDate ? new Date(r.endDate).toLocaleDateString('en-IN') : '—') },
    {
      key: 'pin',
      header: 'Pinned',
      render: (r) => (
        <Button size="icon" variant={r.pinned ? 'soft' : 'ghost'} onClick={() => update(r, { pinned: !r.pinned })} aria-label={r.pinned ? 'Unpin offer' : 'Pin offer'}>
          {r.pinned ? <Pin className="size-4 fill-current" /> : <Pin className="size-4" />}
        </Button>
      ),
    },
    {
      key: 'visible',
      header: 'Visible',
      render: (r) => (
        <Button size="icon" variant="ghost" onClick={() => update(r, { adminHidden: !r.adminHidden })} aria-label={r.adminHidden ? 'Show offer' : 'Hide offer'}>
          {r.adminHidden ? <EyeOff className="size-4 text-rose-600" /> : <Eye className="size-4" />}
        </Button>
      ),
    },
    {
      key: 'open',
      header: '',
      render: (r) => (
        <Button size="icon" variant="ghost" href={r.url} target="_blank" rel="noopener noreferrer" aria-label="Open offer">
          <ExternalLink className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <p className="mb-4 flex items-center gap-1.5 text-sm text-slate-500">
        <Star className="size-4" /> Pinned offers show first on the website; hidden ones never show. Both survive the nightly sync.
      </p>
      <Toolbar>
        <SearchInput value={filters.q} onChange={(v) => setFilter('q', v)} placeholder="Search offer or store" className="sm:w-72" />
        <Select value={filters.visibility} onChange={(e) => setFilter('visibility', e.target.value)} aria-label="Visibility">
          <option value="">All offers</option>
          <option value="pinned">Pinned</option>
          <option value="hidden">Hidden</option>
        </Select>
      </Toolbar>
      <DataTable
        columns={columns}
        rows={list.data.items}
        rowKey={(r) => r.id}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        empty="No offers — run a sync in Affiliate settings"
        page={page}
        pages={list.data.pages}
        total={list.data.total}
        onPage={setPage}
      />
    </div>
  );
}
