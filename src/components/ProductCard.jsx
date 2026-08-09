import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatInr, productImage } from '../utils/format';

export default function ProductCard({ product, index = 0, discountPercent }) {
  const img = productImage(product.images);
  const id = product.id || product._id;
  const was =
    product.highestPrice != null &&
    product.lowestPrice != null &&
    product.highestPrice > product.lowestPrice
      ? product.highestPrice
      : null;
  const pct =
    discountPercent ??
    (was
      ? Math.round(((was - product.lowestPrice) / was) * 100)
      : null);

  return (
    <motion.article
      className="product-tile group"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: Math.min(index * 0.05, 0.35), duration: 0.4 }}
    >
      <Link to={`/products/${id}`} className="block p-3">
        <div className="relative mb-3 aspect-square overflow-hidden rounded-[14px] bg-[var(--dn-surface-2)]">
          {pct != null && pct > 0 ? (
            <span className="dn-badge-discount absolute left-2.5 top-2.5 z-10">{pct}% OFF</span>
          ) : null}
          {img ? (
            <img
              src={img}
              alt=""
              loading="lazy"
              className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="grid h-full place-items-center font-display text-4xl text-ink-faint">
              {product.brand?.slice(0, 1) || 'P'}
            </div>
          )}
        </div>
        <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {product.brand || product.category || 'Brand'}
        </p>
        <h3 className="line-clamp-2 text-[0.9375rem] font-bold leading-snug">{product.title}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="price text-base">{formatInr(product.lowestPrice)}</span>
          {was ? <span className="price text-sm font-normal text-ink-muted line-through">{formatInr(was)}</span> : null}
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          {product.storeCount || 0} store{(product.storeCount || 0) === 1 ? '' : 's'}
        </p>
      </Link>
    </motion.article>
  );
}
