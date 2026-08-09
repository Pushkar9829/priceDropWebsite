import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SearchBar from '../components/SearchBar';
import { brandApi, dealApi, productApi } from '../api/shop';
import { useAuth } from '../context/AuthContext';
import { formatInr, productImage } from '../utils/format';

const CATEGORIES = [
  {
    label: 'All',
    q: '',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Electronics',
    q: 'laptop',
    img: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Fashion',
    q: 'sneakers',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Beauty',
    q: 'beauty',
    img: 'https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Home',
    q: 'furniture',
    img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Food',
    q: 'food',
    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Sports',
    q: 'sports',
    img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Audio',
    q: 'headphones',
    img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Phones',
    q: 'iphone',
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80',
  },
  {
    label: 'Watches',
    q: 'watch',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80',
  },
];

const ease = [0.22, 1, 0.36, 1];

function brandInitial(name = '') {
  return (name.trim()[0] || '?').toUpperCase();
}

function groupByBrand(products) {
  const map = new Map();
  for (const p of products) {
    const brand = (p.brand || 'Other').trim() || 'Other';
    if (!map.has(brand)) {
      map.set(brand, {
        brand,
        products: [],
        maxDiscount: 0,
        dealCount: 0,
      });
    }
    const entry = map.get(brand);
    entry.products.push(p);
    entry.dealCount += 1;
    const high = p.highestPrice;
    const low = p.lowestPrice;
    if (high != null && low != null && high > low) {
      const pct = Math.round(((high - low) / high) * 100);
      if (pct > entry.maxDiscount) entry.maxDiscount = pct;
    }
  }
  return [...map.values()]
    .sort((a, b) => b.dealCount - a.dealCount)
    .map((b) => ({
      ...b,
      products: b.products.slice(0, 3),
    }));
}

function FlameIcon() {
  return (
    <svg className="dn-section__icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c1.5 3 2 5 1 7 2-1 4 1 4 4a5 5 0 11-10 0c0-2 1-3.5 2.5-4.5C8 11 8 8 12 2z" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg className="dn-section__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M14.5 9.5L10 10l-.5 4.5L14 14l.5-4.5z" fill="currentColor" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="dn-section__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18l.9-5.4L4.2 8.7l5.4-.8L12 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryIcon({ type }) {
  const common = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', className: 'dn-section__icon', 'aria-hidden': true };
  switch (type) {
    case 'fashion':
      return (
        <svg {...common}>
          <path d="M8 4l-3 3v5l3 2 1 8h6l1-8 3-2V7l-3-3-2 2h-4L8 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'beauty':
      return (
        <svg {...common}>
          <path d="M9 3h6v4H9V3zm1 4h4l1 14H9l1-14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'food':
      return (
        <svg {...common}>
          <path d="M5 3v8a3 3 0 006 0V3M8 14v7M16 3v18M19 3c0 4-3 5-3 8v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'sports':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 3a12 12 0 010 18M12 3a12 12 0 000 18M3 12h18" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'auto':
      return (
        <svg {...common}>
          <path d="M4 14l2-5h12l2 5v5h-2v-2H6v2H4v-5zM7 16.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    case 'toys':
      return (
        <svg {...common}>
          <rect x="4" y="8" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M9 8V6a3 3 0 016 0v2M9 14h.01M15 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'pets':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2" fill="currentColor" />
          <circle cx="16" cy="8" r="2" fill="currentColor" />
          <circle cx="6" cy="13" r="2" fill="currentColor" />
          <circle cx="18" cy="13" r="2" fill="currentColor" />
          <ellipse cx="12" cy="16" rx="3.5" ry="4" fill="currentColor" />
        </svg>
      );
    case 'electronics':
    default:
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

function BrandLogoCard({ brand, featured }) {
  const brandName = brand.name || brand.brand;
  return (
    <Link
      to={`/search?q=${encodeURIComponent(brandName)}`}
      className="dn-logo-card"
    >
      {brand.maxDiscount > 0 ? (
        <span className="dn-badge-discount absolute left-3 top-3 z-10">
          % {brand.maxDiscount}% OFF
        </span>
      ) : null}
      {featured ? (
        <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-teal text-[0.65rem] text-black">
          ★
        </span>
      ) : null}
      <span className="mt-7 grid aspect-square place-items-center rounded-[14px] bg-white p-[18%]">
        <span className="font-display text-2xl font-bold text-black">
          {brandInitial(brandName)}
        </span>
      </span>
      <span className="truncate font-bold">{brandName}</span>
      <span className="flex flex-wrap gap-x-2.5 gap-y-1 text-[0.8125rem]">
        <span className="text-ink-muted">{brand.category || 'Brand'}</span>
        <span className="font-semibold text-teal">
          {brand.dealCount} deal{brand.dealCount === 1 ? '' : 's'}
        </span>
      </span>
    </Link>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [deals, setDeals] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [topBrands, setTopBrands] = useState([]);
  const [categorySections, setCategorySections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');
  const dropsRail = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      dealApi.list({ limit: 12 }).catch(() => ({ items: [] })),
      productApi.search('', { limit: 24 }).catch(() => ({ items: [] })),
      brandApi.top({ limit: 8, productsPerBrand: 3, minDiscount: 20 }).catch(() => ({ items: [] })),
      brandApi.categories({ limit: 12 }).catch(() => ({ sections: [] })),
    ])
      .then(([dealData, catalogData, brandData, catData]) => {
        if (cancelled) return;
        setDeals(dealData.items || []);
        setCatalog(catalogData.items || []);
        setTopBrands(brandData.items || []);
        setCategorySections(catData.sections || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const brands = useMemo(() => groupByBrand(catalog), [catalog]);
  const offerSource = deals.length
    ? deals
    : catalog.slice(0, 8).map((p) => ({
        _id: p.id || p._id,
        discountPercent:
          p.highestPrice && p.lowestPrice && p.highestPrice > p.lowestPrice
            ? Math.round(((p.highestPrice - p.lowestPrice) / p.highestPrice) * 100)
            : 20,
        title: p.title,
        currentPrice: p.lowestPrice,
        productId: p,
        storeId: { name: p.brand || 'Store' },
      }));

  const scrollDrops = (dir) => {
    const el = dropsRail.current;
    if (!el) return;
    el.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  const brandCountLabel = Math.max(
    categorySections.reduce((n, s) => n + (s.count || 0), 0),
    topBrands.length,
    brands.length,
    1
  );

  return (
    <div>
      {/* Hero */}
      <section className="dn-section pt-8 sm:pt-12">
        <div className="container">
          <motion.span
            className="dn-badge-location"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
            </svg>
            Deals near you · India
          </motion.span>

          <motion.h1
            className="mt-5 max-w-3xl text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.55, ease }}
          >
            <span className="block">Craving a deal?</span>
            <span className="block text-teal">Grab it from your favourite brands.</span>
          </motion.h1>

          <motion.p
            className="mt-3 text-[0.9375rem] text-ink-faint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.14, duration: 0.45 }}
          >
            {brandCountLabel}+ brands · {deals.length || catalog.length || 0} live price
            drops
          </motion.p>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45, ease }}
          >
            <SearchBar large autofocus />
          </motion.div>
        </div>
      </section>

      {/* What's on your mind */}
      <section className="dn-section pt-4">
        <div className="container">
          <div className="dn-section__head">
            <h2 className="dn-section__title">What&apos;s on your mind?</h2>
            <Link to="/search" className="dn-section__link">
              See all
            </Link>
          </div>
          <div className="dn-rail dn-cats" role="list">
            {CATEGORIES.map((cat) => {
              const to = cat.q ? `/search?q=${encodeURIComponent(cat.q)}` : '/search';
              const active = activeCat === cat.label;
              return (
                <Link
                  key={cat.label}
                  to={to}
                  role="listitem"
                  className={`dn-cat ${active ? 'dn-cat--active' : ''}`}
                  onClick={() => setActiveCat(cat.label)}
                >
                  <span className="dn-cat__ring">
                    <img className="dn-cat__img" src={cat.img} alt="" loading="lazy" />
                  </span>
                  <span className="dn-cat__label">{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top offers */}
      <section className="dn-section">
        <div className="container">
          <div className="dn-section__head">
            <h2 className="dn-section__title">
              <FlameIcon />
              Top offers for you
            </h2>
            <Link to="/deals" className="dn-section__link">
              See all
            </Link>
          </div>
          {loading ? (
            <div className="dn-rail">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-40 w-[200px]" />
              ))}
            </div>
          ) : !offerSource.length ? (
            <p className="muted text-sm">No offers yet — search to pull live store prices.</p>
          ) : (
            <div className="dn-rail">
              {offerSource.slice(0, 10).map((deal) => {
                const product = deal.productId;
                const productId = product?._id || product?.id || deal._id;
                const brand =
                  product?.brand || deal.storeId?.name || deal.title?.split(' ')[0] || 'Brand';
                const pct = deal.discountPercent ?? 25;
                return (
                  <Link
                    key={deal._id || deal.id || productId}
                    to={productId ? `/products/${productId}` : '/deals'}
                    className="dn-offer"
                  >
                    <div className="dn-offer__top">
                      <p className="m-0 text-[0.8rem] font-bold uppercase leading-tight">
                        UP TO
                        <strong className="mt-0.5 block text-[1.35rem]">{pct}% OFF</strong>
                      </p>
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-sm font-bold text-black">
                        {brandInitial(brand)}
                      </span>
                    </div>
                    <div className="dn-offer__bottom">
                      <span className="font-bold">{brand}</span>
                      <span className="text-[0.8125rem] text-ink-muted">
                        {deal.storeId?.name ? `1 live deal` : 'Live deal'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Latest best drops */}
      <section className="dn-section">
        <div className="container">
          <div className="dn-section__head">
            <h2 className="dn-section__title">
              <CompassIcon />
              Latest best drops
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-full border border-line-strong text-ink hover:border-teal hover:text-teal"
                aria-label="Previous"
                onClick={() => scrollDrops(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-full border border-line-strong text-ink hover:border-teal hover:text-teal"
                aria-label="Next"
                onClick={() => scrollDrops(1)}
              >
                ›
              </button>
            </div>
          </div>

          {loading ? (
            <div className="dn-rail">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-72 w-[220px]" />
              ))}
            </div>
          ) : !(deals.length || catalog.length) ? (
            <div className="empty">
              <p>No drops yet. Search a product to compare live listings.</p>
              <Link to="/search?q=iphone" className="btn btn-primary mt-4">
                Start a search
              </Link>
            </div>
          ) : (
            <div className="dn-rail" ref={dropsRail}>
              {(deals.length ? deals : catalog).slice(0, 12).map((item) => {
                const isDeal = Boolean(item.discountPercent != null || item.currentPrice != null);
                const product = isDeal ? item.productId || item : item;
                const productId = product?._id || product?.id || item._id;
                const img = productImage(product?.images);
                const title = item.title || product?.title;
                const brand = product?.brand || item.storeId?.name || 'Brand';
                const price = item.currentPrice ?? product?.lowestPrice;
                const was = product?.highestPrice;
                const pct =
                  item.discountPercent ??
                  (was && price && was > price
                    ? Math.round(((was - price) / was) * 100)
                    : null);

                return (
                  <article key={item._id || item.id || productId} className="dn-drop">
                    <Link to={productId ? `/products/${productId}` : '/deals'} className="block p-3">
                      <div className="relative mb-3 aspect-square overflow-hidden rounded-[14px] bg-[var(--dn-surface-2)]">
                        {pct != null ? (
                          <span className="dn-badge-discount absolute left-2.5 top-2.5 z-10">
                            {pct}% OFF
                          </span>
                        ) : null}
                        {img ? (
                          <img src={img} alt="" className="h-full w-full object-contain p-3" />
                        ) : (
                          <div className="grid h-full place-items-center text-3xl text-ink-faint">
                            {brandInitial(brand)}
                          </div>
                        )}
                      </div>
                      <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                        {brand}
                      </p>
                      <h3 className="line-clamp-2 text-[0.9375rem] font-bold leading-snug">
                        {title}
                      </h3>
                      <p className="mt-2 flex items-baseline gap-2">
                        <span className="price">{formatInr(price)}</span>
                        {was && was > price ? (
                          <span className="text-sm text-ink-muted line-through">
                            {formatInr(was)}
                          </span>
                        ) : null}
                      </p>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Top brands — deal grid */}
      <section className="dn-section">
        <div className="container">
          <div className="dn-section__head">
            <h2 className="dn-section__title">
              <StarIcon />
              Top brands
            </h2>
            <Link to="/search" className="dn-section__link">
              See all
            </Link>
          </div>
          {loading && !topBrands.length ? (
            <p className="muted text-sm">Loading brands…</p>
          ) : !topBrands.length ? (
            <p className="muted text-sm">Brands appear here once discounted listings are available.</p>
          ) : (
            <div className="dn-brand-grid">
              {topBrands.map((b) => {
                const brandName = b.name || b.brand;
                return (
                  <article key={b.slug || brandName} className="dn-brand-card">
                    <Link
                      to={`/search?q=${encodeURIComponent(brandName)}`}
                      className="mb-4 flex items-center gap-3"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-sm font-bold text-black">
                        {brandInitial(brandName)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{brandName}</span>
                        <span className="block text-xs text-ink-muted">
                          {b.dealCount} live deal{b.dealCount === 1 ? '' : 's'}
                          {b.maxDiscount > 0 ? ` · up to ${b.maxDiscount}% off` : ''}
                        </span>
                      </span>
                      <span className="text-ink-muted" aria-hidden>
                        ›
                      </span>
                    </Link>
                    <ul className="m-0 flex list-none flex-col gap-3 p-0">
                      {(b.products || []).map((p) => {
                        const id = p.id || p._id;
                        const img = productImage(p.images);
                        const low = p.currentPrice ?? p.lowestPrice;
                        const was = p.mrp ?? p.highestPrice;
                        const pct =
                          p.discountPercent != null
                            ? p.discountPercent
                            : was && low && was > low
                              ? Math.round(((was - low) / was) * 100)
                              : null;
                        return (
                          <li key={id}>
                            <Link to={`/products/${id}`} className="flex items-center gap-2.5">
                              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[var(--dn-surface-2)]">
                                {img ? (
                                  <img
                                    src={img}
                                    alt=""
                                    className="h-full w-full object-contain p-1"
                                  />
                                ) : (
                                  <span className="grid h-full place-items-center text-xs text-ink-faint">
                                    {brandInitial(brandName)}
                                  </span>
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[0.8125rem]">{p.title}</span>
                                <span className="mt-0.5 flex items-baseline gap-1.5 text-[0.8125rem]">
                                  <span className="font-bold">{formatInr(low)}</span>
                                  {was && was > low ? (
                                    <span className="text-ink-muted line-through">
                                      {formatInr(was)}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                              {pct != null ? (
                                <span className="shrink-0 text-sm font-bold text-teal">{pct}%</span>
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Category brand logo grids */}
      {categorySections.map((section) => (
        <section key={section.id || section.category} className="dn-section">
          <div className="container">
            <div className="dn-section__head justify-start gap-3">
              <h2 className="dn-section__title">
                <CategoryIcon type={section.icon} />
                {section.title}
              </h2>
              <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-teal px-2 py-0.5 text-xs font-bold text-black">
                {section.count}
              </span>
            </div>
            <div className="dn-logo-grid">
              {(section.brands || []).map((b, i) => (
                <BrandLogoCard
                  key={b.slug || b.name}
                  brand={b}
                  featured={i < 3}
                />
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="dn-section pb-16">
        <div className="container">
          <div className="mx-auto max-w-xl rounded-[20px] border border-line bg-elevated px-6 py-10 text-center">
            <h2 className="text-2xl font-bold">Never miss a drop</h2>
            <p className="muted mx-auto mt-2 max-w-md text-sm">
              Save products and set target prices — we&apos;ll ping you when listings hit your number.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link to="/alerts" className="btn btn-primary">
                    Manage alerts
                  </Link>
                  <Link to="/watchlist" className="btn btn-soft">
                    Open watchlist
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">
                    Create free account
                  </Link>
                  <Link to="/search?q=iphone" className="btn btn-soft">
                    Browse products
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
