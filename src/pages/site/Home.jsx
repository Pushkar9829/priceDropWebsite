import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgePercent, BedDouble, BellRing, ChevronRight, Flame, Gift, MapPin, Plane, Sparkle, Tag } from 'lucide-react';
import SearchBox from '../../components/site/SearchBox';
import ProductCard, { ProductCardSkeleton } from '../../components/site/ProductCard';
import DealCard from '../../components/site/DealCard';
import BrandCard, { BrandLogo } from '../../components/site/BrandCard';
import { Button, ErrorBanner, Skeleton, cx, staggerStyle } from '../../components/ui';
import { brandApi, dealApi, productApi } from '../../lib/api';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useAuth } from '../../context/AuthContext';
import { useSiteConfig } from '../../context/SiteConfigContext';
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

/** Green glyph for rail entries that have no 3D artwork yet (same footprint as the images). */
function GlyphIcon({ icon: Icon }) {
  return (
    <span className="grid size-[68px] place-items-center">
      <Icon className="size-12 text-[#2fda76] drop-shadow-[0_6px_14px_rgba(47,218,118,0.35)]" strokeWidth={1.6} />
    </span>
  );
}

/** "What's on your mind?" — the fixed shortcuts first, then catalogue categories. */
function CategoryRail({ categories, travelOn }) {
  const rail = useRef(null);
  const known = new Set(['electronics', 'fashion', 'beauty', 'home', 'food', 'sports', 'automotive', 'toys']);
  const items = [
    { label: 'All', to: '/search', image: CATEGORY_IMAGES.all, active: true },
    { label: 'Deal of the Day', to: '/deals', image: CATEGORY_IMAGES.drops },
    ...(travelOn
      ? [
          { label: 'Flights', to: '/travel', icon: Plane },
          { label: 'Hotels', to: '/travel?tab=hotels', icon: BedDouble },
        ]
      : []),
    { label: 'First Order', to: '/offers?q=first', icon: Gift },
    { label: '80% Off', to: '/search?minDiscount=80&sort=discount', icon: BadgePercent },
    ...['Electronics', 'Fashion', 'Beauty', 'Home', 'Food', 'Sports', 'Automotive', 'Toys'].map((name) => ({
      label: name,
      to: `/search?category=${encodeURIComponent(name)}`,
      image: categoryMeta(name).image,
    })),
    // Any other catalogue categories (General, Baby & Kids, Pets…) after the fixed set
    ...categories
      .filter((c) => !known.has(c.name.toLowerCase()))
      .map((c) => ({ label: c.name.split(' ')[0], to: `/search?category=${encodeURIComponent(c.name)}`, image: categoryMeta(c.name).image })),
  ];

  return (
    <div className="relative">
      <div ref={rail} className="rail-green -mx-4 flex gap-4 overflow-x-auto px-4 pt-3 pb-3 sm:mx-0 sm:px-0">
        {items.map(({ label, to, image, icon, active }) => (
          <Link key={to} to={to} aria-current={active ? 'true' : undefined} className="flex w-fit min-w-[84px] shrink-0 flex-col items-center gap-2">
            <span className={cx('block transition-all duration-300', active ? 'scale-110' : 'opacity-85 hover:opacity-100')}>
              {image ? <img src={image} alt="" width={192} height={192} decoding="async" className="size-[68px] object-contain" /> : <GlyphIcon icon={icon} />}
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

/** "Top offers for you" tile: green top with the brand's best discount, dark footer with name. */
function OfferBrandCard({ brand }) {
  return (
    <Link
      to={`/brands/${encodeURIComponent(brand.name)}`}
      className="group block w-[250px] shrink-0 snap-start overflow-hidden rounded-xl border border-white/5 bg-[#252627] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_50px_-20px_rgba(34,197,94,0.35)]"
    >
      <div className="relative h-[100px] bg-gradient-to-br from-[#1f8a4c] to-[#146b3a] px-4 pt-4">
        <BrandLogo name={brand.name} size="sm" className="absolute top-4 right-4 transition-transform duration-300 group-hover:scale-105" />
        <p className="mt-6 text-[11px] font-bold tracking-wider text-[#ffffff]/85 uppercase">Up to</p>
        <p className="text-[22px] leading-tight font-extrabold text-[#ffffff]">{brand.maxDiscount}% OFF</p>
      </div>
      <div className="px-4 py-3">
        <p className="truncate font-semibold text-slate-900">{brand.name}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {brand.dealCount} live deal{brand.dealCount === 1 ? '' : 's'}
        </p>
      </div>
    </Link>
  );
}

function Rail({ children, className }) {
  return <div className={cx('scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0', className)}>{children}</div>;
}

export default function Home() {
  useDocumentTitle('');
  const { isAuthenticated } = useAuth();
  const { sections } = useSiteConfig();
  const deals = useAsync(() => dealApi.list({ limit: 16 }), [], { initial: { items: [], total: 0 } });
  const fresh = useAsync(() => productApi.search({ limit: 8 }), [], { initial: { items: [], total: 0 } });
  const categories = useAsync(() => productApi.categories(), [], { initial: { items: [] } });
  const topBrands = useAsync(() => brandApi.top({ limit: 20 }), [], { initial: { items: [] } });
  const brandWalls = useAsync(() => brandApi.categories({ limit: 12 }), [], { initial: { sections: [], totalBrands: 0 } });

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

  // Biggest discounts first. Brands with no live deal are left out, and so are "discounts" above
  // 90% — those come from sellers listing an inflated MRP and would make the row look fake.
  const offerBrands = [...(topBrands.data?.items || [])]
    .filter((b) => b.maxDiscount > 0 && b.maxDiscount <= 90 && b.dealCount > 0)
    .sort((a, b) => b.maxDiscount - a.maxDiscount)
    .slice(0, 12);

  const totalBrands = brandWalls.data?.totalBrands || 0;
  const statLine = [
    totalBrands >= 10 ? `${totalBrands.toLocaleString('en-IN')}+ brands` : null,
    deals.data?.total ? `${deals.data.total.toLocaleString('en-IN')} live price drops` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="relative isolate">
      {/* Hero */}
      <section className="relative">
        {/* Glow from the top-left corner that fades out over a much taller area than the hero,
            behind the content (-z-10 inside this isolated wrapper), so it has no visible edge */}
        <div className="hero-glow pointer-events-none absolute top-0 left-0 -z-10 h-[1100px] w-full" aria-hidden />
        <div className="relative container-page pt-10 pb-6 sm:pt-14">
          <span className="dn-enter inline-flex items-center gap-1.5 rounded-full bg-[#1fae5b] px-3 py-1.5 text-xs font-semibold text-[#ffffff]">
            <MapPin className="size-3.5" /> Deals near you · India
          </span>
          <h1 className="dn-enter dn-d1 mt-6 max-w-5xl text-4xl leading-[1.06] font-bold tracking-tight sm:text-6xl">
            <span className="block text-slate-900">Craving a deal?</span>
            <span className="block text-[#2fda76]">Grab it from your favourite brands.</span>
          </h1>
          {statLine ? <p className="dn-enter dn-d15 mt-4 text-base text-slate-500 sm:text-lg">{statLine}</p> : null}
          <div className="dn-enter dn-d2 mt-8 max-w-3xl">
            <SearchBox size="lg" placeholder="Search for a brand, e.g. Nike, Apple, Zara…" />
          </div>
        </div>
      </section>

      {/* What's on your mind */}
      <section className="container-page pt-10">
        <SectionTitle title="What's on your mind?" to="/search" />
        <CategoryRail categories={categories.data?.items || []} travelOn={sections.travel !== false} />
      </section>

      {/* Top offers for you */}
      <section className="container-page pt-10">
        <SectionTitle icon={Flame} title="Top offers for you" />
        {topBrands.loading ? (
          <Rail>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[165px] w-[250px] shrink-0 rounded-xl" />
            ))}
          </Rail>
        ) : offerBrands.length ? (
          <Rail>
            {offerBrands.map((b, i) => (
              <div key={b.slug || b.name} className="dn-stagger shrink-0" style={staggerStyle(i)}>
                <OfferBrandCard brand={b} />
              </div>
            ))}
          </Rail>
        ) : null}
      </section>

      {/* Latest best drops */}
      <section className="container-page pt-10">
        <SectionTitle icon={Tag} title="Latest best drops" to="/deals" />
        {deals.error ? (
          <ErrorBanner error={{ message: 'Couldn’t load price drops right now.' }} onRetry={deals.reload} />
        ) : deals.loading ? (
          <Rail>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-44 shrink-0">
                <ProductCardSkeleton />
              </div>
            ))}
          </Rail>
        ) : dealItems.length ? (
          <Rail>
            {dealItems.map((d, i) => (
              <div key={d._id} className="dn-stagger w-44 shrink-0 snap-start sm:w-48" style={staggerStyle(i)}>
                <DealCard deal={d} />
              </div>
            ))}
          </Rail>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {section.brands.map((b, i) => (
              <div key={b.slug || b.name} className="dn-stagger" style={staggerStyle(i)}>
                <BrandCard brand={b} featured={i < 3 && b.dealCount > 0} />
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
