export const formatInr = (value) => {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export const productImage = (images) => {
  if (typeof images === 'string' && images) return images;
  if (Array.isArray(images) && images[0]) return images[0];
  return null;
};
