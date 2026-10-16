import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BedDouble, Plane } from 'lucide-react';
import OfferCard, { StoreMark } from '../../components/site/OfferCard';
import { EmptyState, ErrorBanner, Skeleton, cx, staggerStyle } from '../../components/ui';
import { travelApi } from '../../lib/api';
import { formatInr } from '../../lib/format';
import { useAsync, useDocumentTitle } from '../../lib/hooks';
import { useSiteConfig } from '../../context/SiteConfigContext';

/**
 * Mounts a Travelpayouts widget script (URL set in Admin → Affiliate settings; the backend
 * only accepts Travelpayouts hosts). Their widgets render next to their own <script> tag,
 * so the script is appended inside this box and removed again on unmount.
 */
function TravelWidget({ src }) {
  const box = useRef(null);
  useEffect(() => {
    const el = box.current;
    if (!el || !src) return undefined;
    const script = document.createElement('script');
    script.async = true;
    script.charset = 'utf-8';
    script.src = src;
    el.appendChild(script);
    return () => {
      el.innerHTML = '';
    };
  }, [src]);
  return <div ref={box} className="min-h-24 [&_iframe]:max-w-full" />;
}

const fareDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

/** "Cheap flights from …": cheapest one-way fares per destination (Travelpayouts Data API). */
function CheapFlights({ cities }) {
  const [origin, setOrigin] = useState(cities[0]);
  const fares = useAsync(() => travelApi.flights(origin), [origin], { initial: { fares: [], originName: origin } });
  if (!cities.length) return null;
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Cheap flights from {fares.data.originName || origin}</h2>
        <div className="rail-green -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {cities.map((c) => (
            <button key={c} type="button" onClick={() => setOrigin(c)} className={cx('dn-chip', origin === c && 'active')}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {fares.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : fares.error ? (
        <p className="text-sm text-slate-500">Flight prices are unavailable right now — try the search above.</p>
      ) : fares.data.fares.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {fares.data.fares.map((f, i) => (
              <a
                key={f.to}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group dn-card dn-stagger flex-row items-center gap-3 p-4"
                style={staggerStyle(i)}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-semibold text-slate-900">
                    {fares.data.originName} <ArrowRight className="size-3.5 shrink-0 text-slate-500" /> {f.toName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {fareDate(f.departureAt)} · {f.transfers ? `${f.transfers} stop${f.transfers > 1 ? 's' : ''}` : 'Non-stop'}
                    {f.airline ? ` · ${f.airline}` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] text-slate-500">from</p>
                  <p className="text-lg font-bold text-brand-600 group-hover:underline">{formatInr(f.price)}</p>
                </div>
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">One-way fares found recently; the live price shows when you open the search.</p>
        </>
      ) : (
        <p className="text-sm text-slate-500">No recent fares from this city.</p>
      )}
    </section>
  );
}

const TABS = [
  { key: 'flights', label: 'Flights', icon: Plane },
  { key: 'hotels', label: 'Hotels', icon: BedDouble },
];

export default function Travel() {
  useDocumentTitle('Travel deals');
  const { travel } = useSiteConfig();
  const data = useAsync(() => travelApi.get(), [], { initial: { partners: [], offers: [] } });
  const widgets = { flights: travel.flightsWidgetSrc, hotels: travel.hotelsWidgetSrc };
  const available = TABS.filter((t) => widgets[t.key]);
  const [tab, setTab] = useState('flights');
  const active = available.find((t) => t.key === tab) || available[0];

  return (
    <div className="container-page py-8">
      <div className="relative overflow-hidden rounded-3xl border border-[#3e3f42]/50 bg-[#252627] px-6 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2fda76]/[0.08] via-transparent to-[#2fda76]/5" />
        <div className="dn-blobs" />
        <Plane className="absolute -right-6 -bottom-6 size-40 text-[#2fda76]/10" />
        <h1 className="dn-enter dn-d1 relative text-3xl font-extrabold tracking-tight">Travel deals</h1>
        <p className="dn-enter dn-d15 relative mt-2 max-w-xl text-slate-500">
          Compare flights and hotels, then grab the latest travel coupons from airlines and booking sites.
        </p>

        {available.length ? (
          <div className="dn-enter dn-d2 relative mt-6 rounded-2xl bg-[#181a1b]/70 p-4">
            {available.length > 1 ? (
              <div className="mb-3 flex gap-1">
                {available.map((t) => (
                  <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cx('dn-chip', active?.key === t.key && 'active')}>
                    <t.icon className="size-3.5" /> {t.label}
                  </button>
                ))}
              </div>
            ) : null}
            {active ? <TravelWidget key={active.key} src={widgets[active.key]} /> : null}
          </div>
        ) : null}
      </div>

      {travel.fares && travel.originCities?.length ? <CheapFlights cities={travel.originCities} /> : null}

      <ErrorBanner error={data.error} onRetry={data.reload} />

      <section className="mt-10">
        <h2 className="mb-4 text-xl font-bold">Book with our travel partners</h2>
        {data.loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : data.data.partners.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {data.data.partners.map((s, i) => (
              <div key={s.id} className="dn-stagger" style={staggerStyle(i)}>
                <Link to={`/stores/${s.slug}`} className="group dn-brand-card h-full items-center px-3 py-5 text-center">
                  <span className="transition-transform duration-300 group-hover:scale-105">
                    <StoreMark store={s} size="lg" />
                  </span>
                  <span className="mt-3 line-clamp-1 text-sm font-semibold text-slate-900">{s.name}</span>
                  <span className="mt-0.5 text-xs text-slate-500">
                    {s.offerCount ? <span className="font-semibold text-brand-600">{s.offerCount} offers</span> : 'Travel'}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Plane} title="Travel partners coming soon" description="We're adding airlines, hotels and booking sites." />
        )}
      </section>

      {data.data.offers.length ? (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Travel coupons &amp; deals</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.data.offers.map((o, i) => (
              <div key={o.id} className="dn-stagger" style={staggerStyle(i)}>
                <OfferCard offer={o} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
