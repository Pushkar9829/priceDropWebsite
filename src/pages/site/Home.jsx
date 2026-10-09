import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, ChevronLeft, ChevronRight, Flame, MapPin, Sparkle, Tag } from 'lucide-react';
import SearchBox from '../../components/site/SearchBox';
import ProductCard, { ProductCardSkeleton } from '../../components/site/ProductCard';
import DealCard from '../../components/site/DealCard';
import BrandCard from '../../components/site/BrandCard';
import { Button, ErrorBanner, StoreLogo, cx } from '../../components/ui';
import { brandApi, dealApi, productApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useAuth } from '../../context/AuthContext';
import { categoryMeta } from '../../lib/brands';

function SectionTitle({ emoji, icon: Icon, title, count, to, linkLabel = 'See all' }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight sm:text-2xl">
        {emoji ? <span aria-hidden>{emoji}</span> : null}
        {Icon ? <Icon className="size-5 text-brand-500" /> : null}
        {title}
        {count ? <span className="dn-pill px-2 py-0.5 text-xs">{count}</span> : null}
      </h2>
      {to ? (
        <Link to={to} className="shrink-0 text-sm font-medium text-slate-600 hover:text-slate-900">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

/** "What's on your mind?" — icon tiles that scroll sideways, with a green scroll indicator. */
function CategoryRail({ categories }) {
  const rail = useRef(null);
  const items = [
    { label: 'All', to: '/search', icon: Sparkle, active: true },
    { label: 'Price drops', to: '/deals', icon: Tag },
    ...categories.map((c) => ({ label: c.name, to: `/search?category=${encodeURIComponent(c.name)}`, icon: categoryMeta(c.name).icon })),
  ];

  return (
    <div className="relative">
      <div ref={rail} className="rail-green -mx-4 flex gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {items.map(({ label, to, icon: Icon, active }) => (
          <Link key={label} to={to} className="group flex w-24 shrink-0 flex-col items-center gap-2 py-1 sm:w-28">
            <span
              className={cx(
                'grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#2fda76]/30 to-[#163b26] text-[#2fda76] ring-1 ring-[#2fda76]/20 transition-all duration-300',
                active ? 'scale-110 from-[#2fda76]/50 ring-[#2fda76]/50' : 'opacity-85 group-hover:opacity-100'
              )}
            >
              <Icon className="size-7" strokeWidth={1.75} />
            </span>
            <span className={cx('text-center text-sm font-semibold', active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-900')}>
              {label}
            </span>
          </Link>
        ))}
      </div>
      {items.length > 8 ? (
        <button
          type="button"
          onClick={() => rail.current?.scrollBy({ left: 320, behavior: 'smooth' })}
          className="absolute top-6 right-0 hidden size-8 place-items-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-transparent hover:bg-[#2fda76] hover:text-[#ffffff] lg:grid"
          aria-label="Scroll categories"
        >
          <ChevronRight className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

export default function Home() {
  useDocumentTitle('');
  const { isAuthenticated } = useAuth();
  const deals = useAsync(() => dealApi.list({ limit: 16 }), [], { initial: { items: [] } });
  const fresh = useAsync(() => productApi.search({ limit: 8 }), [], { initial: { items: [], total: 0 } });
  const categories = useAsync(() => productApi.categories(), [], { initial: { items: [] } });
  const stores = useAsync(() => productApi.stores(), [], { initial: { items: [] } });
  const brandWalls = useAsync(() => brandApi.categories({ limit: 12 }), [], { initial: { sections: [], totalBrands: 0 } });
  const dropsRail = useRef(null);

  // One card per product: a product dropping at two stores shouldn't fill two slots
  const dealItems = [];
  const seen = new Set();
  for (const d of deals.data?.items || []) {
    const key = String(d.productId?._id || d.productId || d._id);
    if (!seen.has(key)) {
      seen.add(key);
      dealItems.push(d);
    }
  }

  const storeItems = stores.data?.items || [];
  const totalBrands = brandWalls.data?.totalBrands || 0;
  const statLine = [
    fresh.data?.total ? `${fresh.data.total.toLocaleString('en-IN')}+ products` : null,
    totalBrands >= 10 ? `${totalBrands}+ brands` : null,
    storeItems.length ? `${storeItems.length} stores` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_26rem_at_10%_-10%,rgb(47_201_127/0.14),transparent_70%)]" />
        <div className="relative container-page pt-10 pb-6 sm:pt-14">
          <span className="inline-flex animate-fade-up items-center gap-1.5 rounded-full bg-[#163b26] px-3 py-1 text-xs font-semibold text-[#2fda76]">
            <MapPin className="size-3.5" /> Live price drops · India
          </span>
          <h1 className="mt-5 max-w-4xl animate-fade-up text-4xl leading-[1.08] font-bold tracking-tight [animation-delay:60ms] sm:text-6xl">
            <span className="block text-slate-900">Don&apos;t overpay again.</span>
            <span className="block text-[#2fda76]">Pay the lowest price, always.</span>
          </h1>
          {statLine ? <p className="mt-3 text-[15px] text-slate-500">{statLine}</p> : null}
          <div className="mt-7 max-w-xl animate-fade-up [animation-delay:120ms]">
            <SearchBox size="lg" />
          </div>
          {storeItems.length ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="text-xs font-semibold tracking-wider uppercase">Comparing</span>
              {storeItems.map((s) => (
                <span key={s._id} className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <StoreLogo store={s} size="sm" /> {s.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* What's on your mind */}
      <section className="container-page pt-8">
        <SectionTitle title="What's on your mind?" to="/search" />
        <CategoryRail categories={categories.data?.items || []} />
      </section>

      {/* Price drops */}
      <section className="container-page pt-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight sm:text-2xl">
            <Flame className="size-5 text-brand-500" /> Biggest price drops
            {deals.data?.total ? <span className="dn-pill px-2 py-0.5 text-xs">{deals.data.total}</span> : null}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dropsRail.current?.scrollBy({ left: -300, behavior: 'smooth' })}
              className="hidden size-8 place-items-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-transparent hover:bg-[#2fda76] hover:text-[#ffffff] sm:grid"
              aria-label="Previous deals"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => dropsRail.current?.scrollBy({ left: 300, behavior: 'smooth' })}
              className="hidden size-8 place-items-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-transparent hover:bg-[#2fda76] hover:text-[#ffffff] sm:grid"
              aria-label="More deals"
            >
              <ChevronRight className="size-4" />
            </button>
            <Link to="/deals" className="ml-1 text-sm font-medium text-slate-600 hover:text-slate-900">
              See all
            </Link>
          </div>
        </div>
        {deals.error ? (
          <ErrorBanner error={{ message: 'Couldn’t load price drops right now.' }} onRetry={deals.reload} />
        ) : deals.loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-56 shrink-0">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        ) : dealItems.length ? (
          <div ref={dropsRail} className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {dealItems.map((d) => (
              <div key={d._id} className="w-56 shrink-0 snap-start">
                <DealCard deal={d} />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            No drops detected yet — prices are re-checked around the clock.
          </p>
        )}
      </section>

      {/* Brand walls per category */}
      {brandWalls.data.sections.map((section) => (
        <section key={section.id || section.category} className="container-page pt-12">
          <SectionTitle
            emoji={categoryMeta(section.category).emoji}
            title={section.title}
            count={section.count}
            to={`/search?category=${encodeURIComponent(section.category)}`}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {section.brands.map((b) => (
              <BrandCard key={b.slug || b.name} brand={b} />
            ))}
          </div>
        </section>
      ))}

      {/* Fresh prices */}
      <section className="container-page pt-12">
        <SectionTitle icon={Sparkle} title="Fresh prices" to="/search" />
        {fresh.error ? <ErrorBanner error={{ message: 'Couldn’t load products right now.' }} onRetry={fresh.reload} /> : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {fresh.loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : fresh.data.items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pt-16">
        <div className="relative overflow-hidden rounded-2xl border border-[#2fda76]/20 bg-gradient-to-br from-[#163b26] to-[#181a1b] px-6 py-10 sm:px-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <BellRing className="size-6 text-[#2fda76]" /> Never miss a drop
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-600">
                Watch products and set a target price — tracked products are re-checked every 30 minutes and you&apos;re alerted the moment it hits.
              </p>
            </div>
            <Button to={isAuthenticated ? '/alerts' : '/register'} size="lg" className="rounded-full">
              {isAuthenticated ? 'Manage alerts' : 'Create free account'} <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
