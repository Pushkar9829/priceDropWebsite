import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Search, Store as StoreIcon, Ticket } from 'lucide-react';
import OfferCard, { StoreMark } from '../../components/site/OfferCard';
import { EmptyState, ErrorBanner, Pagination, Skeleton, cx, staggerStyle } from '../../components/ui';
import { offerApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';

const clean = (v) => (v || '').slice(0, 80);

function Hero({ icon: Icon, title, subtitle }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#3e3f42]/50 bg-[#252627] px-6 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2fda76]/[0.08] via-transparent to-[#2fda76]/5" />
      <div className="dn-blobs" />
      <Icon className="absolute -right-6 -bottom-6 size-40 text-[#2fda76]/10" />
      <h1 className="dn-enter dn-d1 relative text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="dn-enter dn-d15 relative mt-2 max-w-xl text-slate-500">{subtitle}</p>
    </div>
  );
}

/** Debounced search box bound to the `q` URL param. */
function SearchField({ value, onChange, placeholder }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (text === value) return undefined;
    const t = setTimeout(() => onChange(text.trim()), 350);
    return () => clearTimeout(t);
  }, [text, value, onChange]);
  return (
    <label className="relative block w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-500" />
      <input className="input h-11 rounded-full pl-10" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </label>
  );
}

function CategoryChips({ categories, active, onPick }) {
  return (
    <div className="rail-green -mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
      <button type="button" className={cx('dn-chip', !active && 'active')} onClick={() => onPick('')}>
        All
      </button>
      {categories.map((c) => (
        <button key={c.name} type="button" className={cx('dn-chip', active === c.name && 'active')} onClick={() => onPick(c.name)}>
          {c.name}
          {c.count != null ? <span className="text-[11px] text-slate-500">{c.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

const useParam = () => {
  const [params, setParams] = useSearchParams();
  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page');
    setParams(next);
  };
  return [params, set];
};

/** /offers — every live coupon and deal from our partner stores. */
export function Offers() {
  useDocumentTitle('Coupons & offers');
  const [params, set] = useParam();
  const category = clean(params.get('category'));
  const q = clean(params.get('q'));
  const type = params.get('type') === 'coupon' ? 'coupon' : '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const facets = useAsync(() => offerApi.stores({ limit: 1 }), [], { initial: { items: [], categories: [] } });
  const offers = useAsync(() => offerApi.list({ category, q, type, page, limit: 24 }), [category, q, type, page], {
    initial: { items: [], total: 0, pages: 1 },
  });

  return (
    <div className="container-page py-8">
      <Hero icon={Ticket} title="Coupons & offers" subtitle="Live coupon codes and deals from hundreds of Indian stores, updated daily. Copy a code, then shop at the store." />

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1">
          <button type="button" className={cx('dn-chip', !type && 'active')} onClick={() => set({ type: '' })}>
            All offers
          </button>
          <button type="button" className={cx('dn-chip', type === 'coupon' && 'active')} onClick={() => set({ type: 'coupon' })}>
            Coupon codes only
          </button>
        </div>
        <SearchField value={q} onChange={(v) => set({ q: v })} placeholder="Search offers or stores" />
      </div>
      <div className="mt-3">
        <CategoryChips categories={facets.data.categories} active={category} onPick={(c) => set({ category: c })} />
      </div>

      <div className="mt-6">
        <ErrorBanner error={offers.error} onRetry={offers.reload} />
        {offers.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : offers.data.items.length ? (
          <>
            <p className="mb-4 text-sm text-slate-500">{offers.data.total.toLocaleString('en-IN')} live offers</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {offers.data.items.map((o, i) => (
                <div key={o.id} className="dn-stagger" style={staggerStyle(i)}>
                  <OfferCard offer={o} />
                </div>
              ))}
            </div>
            <Pagination className="mt-8" page={offers.data.page} pages={offers.data.pages} total={offers.data.total} onChange={(p) => set({ page: String(p) })} />
          </>
        ) : (
          <EmptyState icon={Ticket} title="No offers match" description="Try another category or clear the search." />
        )}
      </div>
    </div>
  );
}

/** /stores — directory of partner stores. */
export function Stores() {
  useDocumentTitle('Stores');
  const [params, set] = useParam();
  const category = clean(params.get('category'));
  const q = clean(params.get('q'));
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);
  const stores = useAsync(() => offerApi.stores({ category, q, page, limit: 48 }), [category, q, page], {
    initial: { items: [], total: 0, pages: 1, categories: [] },
  });

  return (
    <div className="container-page py-8">
      <Hero icon={StoreIcon} title="Shop by store" subtitle="Hundreds of Indian stores in one place, with their latest coupons and deals." />

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{stores.loading ? 'Loading…' : `${stores.data.total.toLocaleString('en-IN')} stores`}</p>
        <SearchField value={q} onChange={(v) => set({ q: v })} placeholder="Find a store" />
      </div>
      <div className="mt-3">
        <CategoryChips categories={stores.data.categories} active={category} onPick={(c) => set({ category: c })} />
      </div>

      <div className="mt-6">
        <ErrorBanner error={stores.error} onRetry={stores.reload} />
        {stores.loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : stores.data.items.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {stores.data.items.map((s, i) => (
                <div key={s.id} className="dn-stagger" style={staggerStyle(i)}>
                  <Link to={`/stores/${s.slug}`} className="group dn-brand-card h-full items-center px-3 py-5 text-center">
                    <span className="transition-transform duration-300 group-hover:scale-105">
                      <StoreMark store={s} size="lg" />
                    </span>
                    <span className="mt-3 line-clamp-1 text-sm font-semibold text-slate-900">{s.name}</span>
                    <span className="mt-0.5 text-xs text-slate-500">
                      {s.offerCount ? <span className="font-semibold text-brand-600">{s.offerCount} offers</span> : s.categories?.[0] || 'Store'}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
            <Pagination className="mt-8" page={stores.data.page} pages={stores.data.pages} total={stores.data.total} onChange={(p) => set({ page: String(p) })} />
          </>
        ) : (
          <EmptyState icon={StoreIcon} title="No stores found" description="Try another category or search." />
        )}
      </div>
    </div>
  );
}

/** /stores/:slug — one store: shop button + all its live offers. */
export function StorePage() {
  const { slug } = useParams();
  const data = useAsync(() => offerApi.store(slug), [slug], { initial: null });
  const store = data.data?.store;
  useDocumentTitle(store ? `${store.name} coupons & offers` : 'Store');

  if (data.loading) {
    return (
      <div className="container-page py-8">
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    );
  }
  if (data.error || !store) {
    return (
      <div className="container-page py-16">
        <EmptyState as="h1" icon={StoreIcon} title="Store not found" description="This store isn't available right now." action={<Link to="/stores" className="dn-link text-sm">Browse all stores</Link>} />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Link to="/stores" className="dn-link inline-flex items-center gap-1.5 text-sm font-medium text-slate-500">
        <ArrowLeft className="size-4" /> All stores
      </Link>
      <div className="mt-6 flex flex-col gap-5 rounded-3xl border border-[#3e3f42]/50 bg-[#252627] p-6 sm:flex-row sm:items-center sm:p-8">
        <StoreMark store={store} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="dn-enter dn-d1 text-2xl font-bold tracking-tight sm:text-3xl">{store.name} coupons &amp; offers</h1>
          <p className="dn-enter dn-d15 mt-1 text-sm text-slate-500">
            {data.data.offers.length ? `${data.data.offers.length} live offers` : 'No live offers right now'}
            {store.categories?.length ? ` · ${store.categories.slice(0, 3).join(', ')}` : ''}
          </p>
        </div>
        {store.shopUrl ? (
          <a
            href={store.shopUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#22bf63] to-[#49df87] px-8 font-semibold text-[#ffffff] shadow-lg shadow-[#2fda76]/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-[#2fda76]/50 active:scale-[0.98]"
          >
            Shop at {store.name} <ExternalLink className="size-4" />
          </a>
        ) : null}
      </div>

      {data.data.offers.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.data.offers.map((o, i) => (
            <div key={o.id} className="dn-stagger" style={staggerStyle(i)}>
              <OfferCard offer={o} showStore={false} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState className="mt-8" icon={Ticket} title="No live offers" description={`Check back soon — or shop at ${store.name} directly.`} />
      )}
    </div>
  );
}
