import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BellRing, ChevronLeft, ChevronRight, Flame, Sparkle } from 'lucide-react';
import SearchBox from '../../components/site/SearchBox';
import ProductCard, { ProductCardSkeleton } from '../../components/site/ProductCard';
import DealCard from '../../components/site/DealCard';
import BrandCard from '../../components/site/BrandCard';
import { Button, ErrorBanner, LiveDot, StoreLogo, cx, staggerStyle } from '../../components/ui';
import PriceTicker from '../../components/site/PriceTicker';
import { brandApi, dealApi, productApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useAuth } from '../../context/AuthContext';
import { CATEGORY_IMAGES, categoryMeta } from '../../lib/brands';

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
        <Link to={to} className="shrink-0 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900">
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
    { label: 'All', to: '/search', image: CATEGORY_IMAGES.all, active: true },
    { label: 'Price drops', to: '/deals', image: CATEGORY_IMAGES.drops },
    ...categories.map((c) => ({
      label: c.name.split(' ')[0],
      to: `/search?category=${encodeURIComponent(c.name)}`,
      image: categoryMeta(c.name).image,
    })),
  ];

  return (
    <div className="relative">
      <div ref={rail} className="rail-green -mx-4 flex gap-4 overflow-x-auto px-4 pt-3 pb-3 sm:mx-0 sm:px-0">
        {items.map(({ label, to, image, active }) => (
          <Link key={to} to={to} aria-current={active ? 'true' : undefined} className="flex w-fit min-w-[84px] shrink-0 flex-col items-center gap-2">
            <span className={cx('block transition-all duration-300', active ? 'scale-110' : 'opacity-85 hover:opacity-100')}>
              <img src={image} alt="" width={192} height={192} decoding="async" className="size-[68px] object-contain" />
            </span>
            <span
              className={cx(
                'text-center text-[13px] leading-tight font-bold tracking-tight whitespace-nowrap md:text-sm',
                active ? 'text-slate-900' : 'text-slate-500'
              )}
            >
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
  const tickerSrc = useAsync(() => productApi.search({ limit: 40 }), [], { initial: { items: [] } });
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

  // Ticker: real price drops first, then catalog items currently below MRP
  const tickerItems = [
    ...dealItems.map((d) => ({
      id: d.productId?._id || d.productId?.id,
      brand: d.productId?.brand,
      discount: Math.round(d.discountPercent || 0),
      price: d.currentPrice,
    })),
    ...(tickerSrc.data?.items || [])
      .filter((p) => p.discountPercent > 0 && p.lowestPrice)
      .map((p) => ({ id: p.id, brand: p.brand, discount: p.discountPercent, price: p.lowestPrice })),
  ]
    .filter((t) => t.id && t.discount > 0)
    .slice(0, 20);

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
      <PriceTicker items={tickerItems} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2fda76]/[0.08] via-transparent to-[#2fda76]/5" />
        <div className="dn-blobs" />
        <div className="relative container-page pt-10 pb-6 sm:pt-14">
          <span className="dn-enter inline-flex items-center gap-2 rounded-full bg-[#163b26] px-3 py-1 text-xs font-semibold text-[#2fda76]">
            <LiveDot className="size-2" /> Live price drops · India
          </span>
          <h1 className="dn-enter dn-d1 mt-5 max-w-4xl text-4xl leading-[1.08] font-bold tracking-tight sm:text-6xl">
            <span className="block text-slate-900">Don&apos;t overpay again.</span>
            <span className="text-gradient-primary block">Pay the lowest price, always.</span>
          </h1>
          {statLine ? <p className="dn-enter dn-d15 mt-3 text-[15px] text-slate-500">{statLine}</p> : null}
          <div className="dn-enter dn-d2 mt-7 max-w-xl">
            <SearchBox size="lg" />
          </div>
          {storeItems.length ? (
            <div className="dn-enter dn-d25 mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
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
            {dealItems.map((d, i) => (
              <div key={d._id} className="dn-stagger w-56 shrink-0 snap-start" style={staggerStyle(i)}>
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
            {section.brands.map((b, i) => (
              <div key={b.slug || b.name} className="dn-stagger" style={staggerStyle(i)}>
                <BrandCard brand={b} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Fresh prices */}
      <section className="container-page pt-12">
        <SectionTitle icon={Sparkle} title="Fresh prices" to="/search" />
        {fresh.error ? <ErrorBanner error={{ message: 'Couldn’t load products right now.' }} onRetry={fresh.reload} /> : null}
        {fresh.loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : fresh.data.items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {fresh.data.items.map((p, i) => (
              <div key={p.id} className="dn-stagger" style={staggerStyle(i)}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
            No priced products yet. Search a brand or wait for listings to refresh.
          </p>
        )}
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
