import { forwardRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ImageOff, Loader2, PackageOpen, X } from 'lucide-react';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

const BUTTON_VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800',
  secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
};
const BUTTON_SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-base',
  icon: 'size-9 rounded-xl',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, className, children, as, disabled, ...props },
  ref
) {
  const Comp = as || (props.to ? Link : props.href ? 'a' : 'button');
  return (
    <Comp
      ref={ref}
      className={cx(
        'btn inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-50',
        `btn-${variant}`,
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className
      )}
      disabled={Comp === 'button' ? disabled || loading : undefined}
      {...(Comp === 'button' && !props.type ? { type: 'button' } : {})}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Comp>
  );
});

export const Input = forwardRef(function Input({ label, hint, error, className, id, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div className={className}>
      {label ? (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input ref={ref} id={inputId} className={cx('input', error && 'border-rose-300 focus:ring-rose-100')} {...props} />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
});

export function Select({ label, className, children, ...props }) {
  return (
    <div className={className}>
      {label ? <label className="label">{label}</label> : null}
      <select className="input pr-8" {...props}>
        {children}
      </select>
    </div>
  );
}

const BADGE_TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
};

export function Badge({ tone = 'slate', className, children }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset',
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONES = {
  SUCCESS: 'green',
  ACTIVE: 'green',
  IN_STOCK: 'green',
  SENT: 'green',
  completed: 'green',
  TRIGGERED: 'brand',
  READ: 'slate',
  PENDING: 'amber',
  PAUSED: 'amber',
  running: 'blue',
  UNKNOWN: 'slate',
  PREORDER: 'blue',
  FAILED: 'red',
  failed: 'red',
  PRODUCT_NOT_FOUND: 'red',
  OUT_OF_STOCK: 'red',
  TEMPORARILY_UNAVAILABLE: 'amber',
  CANCELLED: 'slate',
  DECREASE: 'green',
  INCREASE: 'red',
  INITIAL: 'slate',
  AVAILABILITY_CHANGE: 'blue',
  HISTORICAL_LOW: 'brand',
  MAJOR: 'green',
  SIGNIFICANT: 'blue',
  NORMAL: 'slate',
  ADMIN: 'brand',
  USER: 'slate',
};

export function StatusBadge({ status }) {
  if (!status) return <span className="text-slate-400">—</span>;
  const label = String(status).replaceAll('_', ' ').toLowerCase();
  return (
    <Badge tone={STATUS_TONES[status] || 'slate'} className="capitalize">
      {label}
    </Badge>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cx('size-5 animate-spin text-brand-600', className)} />;
}

export function Skeleton({ className }) {
  return <div className={cx('skeleton', className)} />;
}

/** `as="h1"` when the empty state IS the page (404, not found) so the page keeps a heading. */
export function EmptyState({ icon: Icon = PackageOpen, title, description, action, className, as: Heading = 'h3' }) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="size-7" />
      </div>
      <Heading className="text-base font-semibold text-slate-900">{title}</Heading>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <span>{error.message || String(error)}</span>
      {onRetry ? (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function Pagination({ page, pages, total, onChange, className }) {
  if (!pages || pages <= 1) return null;
  const nums = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  for (let i = start; i <= Math.min(pages, start + 4); i += 1) nums.push(i);
  return (
    <div className={cx('flex flex-wrap items-center justify-between gap-3', className)}>
      <p className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-700">{page}</span> of {pages}
        {total != null ? <> · {total.toLocaleString('en-IN')} results</> : null}
      </p>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Button>
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cx(
              'size-9 rounded-xl text-sm font-medium transition',
              n === page ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {n}
          </button>
        ))}
        <Button size="icon" variant="ghost" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cx(
          'relative max-h-[90vh] w-full animate-fade-up overflow-y-auto rounded-t-2xl bg-white shadow-lift sm:rounded-2xl',
          size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50',
        checked ? 'bg-emerald-500' : 'bg-slate-300'
      )}
    >
      <span className={cx('inline-block size-5 rounded-full bg-white shadow transition', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  );
}

export function StoreLogo({ store, size = 'md' }) {
  const name = store?.name || 'Store';
  const dim = size === 'sm' ? 'size-7 text-[10px]' : size === 'lg' ? 'size-12 text-sm' : 'size-9 text-xs';
  // logo.clearbit.com (used by older seed data) is gone — fall back to the store's favicon
  const logo =
    store?.logo && !store.logo.includes('clearbit.com')
      ? store.logo
      : store?.domain
        ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(store.domain)}&sz=128`
        : null;
  return (
    <span className={cx('relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-[#ffffff] font-bold text-[#3f4248]', dim)}>
      {name.slice(0, 2).toUpperCase()}
      {logo ? (
        <img
          src={logo}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full bg-[#ffffff] object-contain p-1"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
    </span>
  );
}

/**
 * Product image tile. `tone="light"` keeps a true-white tile even inside the dark shopper
 * theme (product photos are shot on white), like a logo plate on a dark card.
 */
export function ProductThumb({ src, alt = '', className, fallback, compact = false, tone }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const showImage = src && !failed;
  const light = tone === 'light';
  return (
    <div className={cx('relative grid place-items-center overflow-hidden', light ? 'bg-[#ffffff]' : 'bg-white', className)}>
      {showImage ? (
        <img src={src} alt={alt} loading="lazy" className="dn-zoom absolute inset-0 size-full object-contain p-3" onError={() => setFailed(true)} />
      ) : (
        // Missing/broken image: a deliberate placeholder instead of a blank tile
        <div
          className={cx(
            'absolute inset-0 grid place-items-center',
            light ? 'bg-gradient-to-br from-[#f4f4f5] to-[#e7e7ea]' : 'bg-gradient-to-br from-slate-50 to-slate-100'
          )}
        >
          <div className={cx('flex flex-col items-center gap-1.5', light ? 'text-[#8a8d93]' : 'text-slate-400')}>
            {compact ? (
              <span className="text-sm font-bold">{(fallback || alt || '?').slice(0, 1).toUpperCase()}</span>
            ) : (
              <>
                <span
                  className={cx(
                    'grid size-12 place-items-center rounded-2xl text-lg font-bold shadow-sm',
                    light ? 'bg-[#ffffff] text-[#3f4248]' : 'bg-white text-slate-500'
                  )}
                >
                  {(fallback || alt || '?').slice(0, 1).toUpperCase()}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium">
                  <ImageOff className="size-3" /> No image
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Grid cascade delay: index * 30ms, capped so long lists don't wait seconds. */
export const staggerStyle = (index) => ({ animationDelay: `${Math.min(index, 24) * 0.03}s` });

/** Pinging green "live" dot. */
export function LiveDot({ className }) {
  return (
    <span className={cx('relative inline-flex size-2.5 shrink-0', className)} aria-hidden>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2fda76] opacity-75" />
      <span className="relative inline-flex size-2.5 rounded-full bg-[#2fda76]" />
    </span>
  );
}
