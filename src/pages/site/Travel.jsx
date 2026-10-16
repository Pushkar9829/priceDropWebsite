import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Plane } from 'lucide-react';
import OfferCard, { StoreMark } from '../../components/site/OfferCard';
import { EmptyState, ErrorBanner, Skeleton, cx, staggerStyle } from '../../components/ui';
import { travelApi } from '../../lib/api';
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
