import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, ExternalLink, Ticket } from 'lucide-react';
import { cx } from '../ui';

// "Till 31 Oct" this year, "Till 31 Jul 2027" beyond it — a bare past-looking month reads as expired
const fmtEnd = (d) => {
  if (!d) return null;
  const date = new Date(d);
  const opts = { day: 'numeric', month: 'short' };
  if (date.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return date.toLocaleDateString('en-IN', opts);
};

/** Store logo tile: the campaign image on a white plate, or a monogram. */
export function StoreMark({ store, size = 'md' }) {
  const [failed, setFailed] = useState(false);
  const dims = size === 'lg' ? 'size-16 rounded-2xl text-2xl' : size === 'sm' ? 'size-9 rounded-lg text-sm' : 'size-12 rounded-xl text-lg';
  return (
    <span className={cx('grid shrink-0 place-items-center overflow-hidden bg-[#ffffff] font-extrabold text-[#111315] shadow-sm ring-1 ring-black/5', dims)}>
      {store?.image && !failed ? (
        <img src={store.image} alt="" loading="lazy" className="size-4/5 object-contain" onError={() => setFailed(true)} />
      ) : (
        (store?.name || '?').slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

/** One coupon or deal. The code copies on click; "Get deal" opens the tracked store link. */
export default function OfferCard({ offer, showStore = true }) {
  const [copied, setCopied] = useState(false);
  const ends = fmtEnd(offer.endDate);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(offer.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the code stays visible to copy by hand */
    }
  };

  return (
    <article className="dn-card h-full p-4">
      {showStore ? (
        <div className="mb-3 flex items-center gap-3">
          <StoreMark store={offer.store} size="sm" />
          {offer.store?.slug ? (
            <Link to={`/stores/${offer.store.slug}`} className="dn-link truncate text-sm font-semibold text-slate-700">
              {offer.store.name}
            </Link>
          ) : (
            <span className="truncate text-sm font-semibold text-slate-700">{offer.store?.name}</span>
          )}
          {offer.couponCode ? (
            <span className="dn-pill ml-auto shrink-0 gap-1 px-2 py-0.5 text-[11px]">
              <Ticket className="size-3" /> Coupon
            </span>
          ) : null}
        </div>
      ) : null}
      <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-slate-900">{offer.title}</h3>
      {offer.description ? <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{offer.description}</p> : null}

      <div className="mt-auto pt-4">
        {offer.couponCode ? (
          <button
            type="button"
            onClick={copy}
            className="mb-2.5 flex w-full items-center justify-between gap-2 rounded-xl border border-dashed border-[#2fda76]/50 bg-[#163b26]/60 px-3 py-2 font-mono text-sm font-bold tracking-wide text-[#2fda76] transition-colors hover:bg-[#163b26]"
            aria-label={`Copy coupon code ${offer.couponCode}`}
          >
            <span className="truncate">{offer.couponCode}</span>
            {copied ? <Check className="size-4 shrink-0" /> : <Copy className="size-4 shrink-0" />}
          </button>
        ) : null}
        <div className="flex items-center gap-3">
          <a
            href={offer.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-br from-[#22bf63] to-[#49df87] px-4 text-sm font-semibold text-[#ffffff] shadow-lg shadow-[#2fda76]/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-[#2fda76]/40 active:scale-[0.98]"
          >
            {offer.couponCode ? 'Use at store' : 'Get deal'} <ExternalLink className="size-3.5" />
          </a>
          {ends ? <span className="shrink-0 text-xs text-slate-500">Till {ends}</span> : null}
        </div>
      </div>
    </article>
  );
}
