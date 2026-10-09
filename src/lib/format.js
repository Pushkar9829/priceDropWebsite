const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('en-IN');

export const formatInr = (value) =>
  value == null || Number.isNaN(Number(value)) ? '—' : inr.format(Number(value));

export const formatNumber = (value) => (value == null ? '—' : num.format(value));

export const productImage = (images) => {
  if (typeof images === 'string' && images) return images;
  if (Array.isArray(images) && images[0]) return images[0];
  return null;
};

export const discountPct = (was, now) =>
  was && now && was > now ? Math.round(((was - now) / was) * 100) : null;

export const formatDate = (value, withTime = true) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : { year: 'numeric' }),
  });
};

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
export const timeAgo = (value) => {
  if (!value) return 'never';
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return 'just now';
};

export const humanize = (s) =>
  s ? String(s).replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : '—';

/** Product id from any of the shapes the API returns (id, _id, populated ref). */
export const idOf = (x) => (x && typeof x === 'object' ? x.id || x._id : x);
